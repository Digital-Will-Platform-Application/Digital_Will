import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';
import { sendJwtAuthError, sendMissingToken, sendMalformedToken } from '../utils/jwtAuthError.js';
import { findUserForAdminGate, isMissingSecondaryAdminColumn } from '../utils/userQueries.js';

const router = express.Router();

function isAdminEmail(email) {
  const configured = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!configured) return false;
  return String(email || '').trim().toLowerCase() === configured;
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/** Primary admin (ADMIN_EMAIL) or secondary admin (Neon is_secondary_admin). */
async function requireAnyAdmin(req, res) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      sendMissingToken(res);
      return null;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) {
      sendMalformedToken(res);
      return null;
    }
    const r = await findUserForAdminGate(userId);
    if (r.rows.length === 0) {
      res.status(401).json({ success: false, message: 'User not found' });
      return null;
    }
    const row = r.rows[0];
    const is_super_admin = isAdminEmail(row.email);
    const is_secondary = Boolean(row.is_secondary_admin) && !is_super_admin;
    if (!is_super_admin && !is_secondary) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return null;
    }
    return {
      userId: row.id,
      email: row.email,
      is_super_admin,
      is_secondary_admin: is_secondary,
    };
  } catch (error) {
    sendJwtAuthError(res, error);
    return null;
  }
}

async function requireSuperAdmin(req, res) {
  const admin = await requireAnyAdmin(req, res);
  if (!admin) return null;
  if (!admin.is_super_admin) {
    res.status(403).json({ success: false, message: 'Only the primary admin can access this.' });
    return null;
  }
  return admin;
}

/** Non-admin users only (same idea as user management). $1 = ADMIN_EMAIL or null */
const NON_ADMIN_USER_SQL = `(COALESCE(NULLIF(TRIM($1::text), ''), '') = '' OR LOWER(TRIM(u.email)) <> LOWER(TRIM($1::text)))`;

router.get('/stats', async (req, res) => {
  try {
    const admin = await requireAnyAdmin(req, res);
    if (!admin) return;

    const adminEmailParam = String(process.env.ADMIN_EMAIL || '').trim() || null;
    const pUser = [adminEmailParam];
    const currentYear = new Date().getFullYear();
    const yearFloor = currentYear - 4;

    const [
      totalUsersR,
      usersTodayR,
      usersThisWeekR,
      usersThisMonthR,
      usersThisYearR,
      usersLast7DaysR,
      dailyR,
      monthlyR,
      yearlyR,
      assetsTotalR,
      assetsTodayR,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS c FROM users u WHERE ${NON_ADMIN_USER_SQL} AND TRIM(COALESCE(u.email, '')) <> ''`,
        pUser
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM users u WHERE ${NON_ADMIN_USER_SQL} AND u.created_at::date = CURRENT_DATE`,
        pUser
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM users u WHERE ${NON_ADMIN_USER_SQL} AND u.created_at >= date_trunc('week', CURRENT_TIMESTAMP::timestamptz)`,
        pUser
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM users u WHERE ${NON_ADMIN_USER_SQL} AND u.created_at >= date_trunc('month', CURRENT_TIMESTAMP::timestamptz)`,
        pUser
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM users u WHERE ${NON_ADMIN_USER_SQL} AND u.created_at >= date_trunc('year', CURRENT_TIMESTAMP::timestamptz)`,
        pUser
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM users u WHERE ${NON_ADMIN_USER_SQL} AND u.created_at::date >= CURRENT_DATE - INTERVAL '6 days'`,
        pUser
      ),
      pool.query(
        `SELECT gs::date::text AS day, COALESCE(t.c, 0)::int AS c
         FROM generate_series(
           (CURRENT_DATE - INTERVAL '6 days')::date,
           CURRENT_DATE::date,
           '1 day'::interval
         ) AS gs
         LEFT JOIN (
           SELECT u.created_at::date AS d, COUNT(*)::int AS c
           FROM users u
           WHERE ${NON_ADMIN_USER_SQL}
           GROUP BY u.created_at::date
         ) t ON t.d = gs::date
         ORDER BY gs ASC`,
        pUser
      ),
      pool.query(
        `SELECT EXTRACT(MONTH FROM u.created_at)::int AS m, COUNT(*)::int AS c
         FROM users u
         WHERE ${NON_ADMIN_USER_SQL} AND u.created_at >= date_trunc('year', CURRENT_TIMESTAMP::timestamptz)
         GROUP BY EXTRACT(MONTH FROM u.created_at) ORDER BY m ASC`,
        pUser
      ),
      pool.query(
        `SELECT EXTRACT(YEAR FROM u.created_at)::int AS y, COUNT(*)::int AS c
         FROM users u
         WHERE ${NON_ADMIN_USER_SQL} AND EXTRACT(YEAR FROM u.created_at) >= $2::int
         GROUP BY EXTRACT(YEAR FROM u.created_at) ORDER BY y ASC`,
        [adminEmailParam, yearFloor]
      ),
      pool.query(`SELECT COUNT(*)::int AS c FROM assets`, []),
      pool.query(`SELECT COUNT(*)::int AS c FROM assets WHERE created_at::date = CURRENT_DATE`, []),
    ]);

    const dailyRegistrations = dailyR.rows.map((row) => {
      const parts = String(row.day).split('-');
      const y = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      const da = parseInt(parts[2], 10);
      const dt = new Date(y, mo, da);
      return {
        date: row.day,
        count: row.c,
        shortLabel: dt.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = Object.fromEntries(monthlyR.rows.map((row) => [Number(row.m), Number(row.c)]));
    const monthlyRegistrationsThisYear = monthNames.map((monthLabel, idx) => ({
      month: idx + 1,
      monthLabel,
      count: monthMap[idx + 1] ?? 0,
    }));

    const yearMap = Object.fromEntries(yearlyR.rows.map((row) => [Number(row.y), Number(row.c)]));
    const yearlyRegistrations = [];
    for (let y = yearFloor; y <= currentYear; y++) {
      yearlyRegistrations.push({ year: y, count: yearMap[y] ?? 0 });
    }

    res.json({
      success: true,
      data: {
        totalUsers: totalUsersR.rows[0].c,
        totalRegisteredEmails: totalUsersR.rows[0].c,
        usersToday: usersTodayR.rows[0].c,
        usersThisWeek: usersThisWeekR.rows[0].c,
        usersThisMonth: usersThisMonthR.rows[0].c,
        usersThisYear: usersThisYearR.rows[0].c,
        usersLast7Days: usersLast7DaysR.rows[0].c,
        dailyRegistrations,
        monthlyRegistrationsThisYear,
        yearlyRegistrations,
        totalAssets: assetsTotalR.rows[0].c,
        assetsToday: assetsTodayR.rows[0].c,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load admin stats',
      error: error.message,
    });
  }
});

/** Signups on a single calendar day (non-admin, with email). ?date=YYYY-MM-DD */
router.get('/registrations-on-date', async (req, res) => {
  try {
    const admin = await requireAnyAdmin(req, res);
    if (!admin) return;

    const dateStr = req.query.date != null ? String(req.query.date).trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date. Use YYYY-MM-DD.',
      });
    }

    const adminEmailParam = String(process.env.ADMIN_EMAIL || '').trim() || null;
    const result = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM users u
       WHERE ${NON_ADMIN_USER_SQL}
         AND TRIM(COALESCE(u.email, '')) <> ''
         AND u.created_at::date = $2::date`,
      [adminEmailParam, dateStr]
    );

    return res.json({
      success: true,
      data: {
        date: dateStr,
        count: result.rows[0].c,
      },
    });
  } catch (error) {
    console.error('registrations-on-date:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load registrations for date',
      error: error.message,
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const admin = await requireAnyAdmin(req, res);
    if (!admin) return;

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const sort = String(req.query.sort || 'newest').toLowerCase();
    let orderClause = 'ORDER BY created_at DESC';
    if (sort === 'name') {
      orderClause = 'ORDER BY LOWER(COALESCE(username, \'\')) ASC, id ASC';
    } else if (sort === 'email') {
      orderClause = 'ORDER BY LOWER(TRIM(COALESCE(email, \'\'))) ASC, id ASC';
    }

    const params = [];
    let whereClause = '';
    if (adminEmail) {
      whereClause = 'WHERE LOWER(TRIM(email)) <> $1';
      params.push(adminEmail);
    }

    const result = await pool.query(
      `SELECT id, username, email, mobile, created_at
       FROM users
       ${whereClause}
       ${orderClause}
       LIMIT 5000`,
      params
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load users',
      error: error.message,
    });
  }
});

/** List secondary admins (primary admin only). */
router.get('/sub-admins', async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;

    const primaryEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const result = await pool.query(
      `SELECT id, username, email, created_at
       FROM users
       WHERE COALESCE(is_secondary_admin, FALSE) = TRUE
         AND ($1::text = '' OR LOWER(TRIM(email)) <> $1)
       ORDER BY created_at DESC`,
      [primaryEmail]
    );

    return res.json({
      success: true,
      data: { admins: result.rows },
    });
  } catch (error) {
    console.error('sub-admins list:', error);
    if (isMissingSecondaryAdminColumn(error)) {
      return res.status(503).json({
        success: false,
        message:
          'This feature requires database migration 009 (is_secondary_admin). Run backend/migrations/009_add_is_secondary_admin_to_users.sql on your Neon database.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to load sub-admins',
      ...(process.env.NODE_ENV !== 'production' ? { code: error.code } : {}),
    });
  }
});

/** Create a secondary admin account in Neon (primary admin only). */
router.post('/sub-admins', async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;

    const fullName = String(req.body.full_name || req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    if (isAdminEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'This email is reserved for the primary admin.',
      });
    }

    const dup = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (dup.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    let username = fullName.slice(0, 100);
    let suffix = 0;
    while (true) {
      const uq = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      if (uq.rows.length === 0) break;
      suffix += 1;
      username = `${fullName.slice(0, 80)}_${suffix}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      `INSERT INTO users (username, email, mobile, password, is_secondary_admin)
       VALUES ($1, $2, NULL, $3, TRUE)
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    const row = insert.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Secondary admin created. They can sign in with this email and password.',
      data: { user: row },
    });
  } catch (error) {
    console.error('create sub-admin:', error);
    if (isMissingSecondaryAdminColumn(error)) {
      return res.status(503).json({
        success: false,
        message:
          'Cannot create secondary admin until migration 009 is applied (is_secondary_admin column). Run backend/migrations/009_add_is_secondary_admin_to_users.sql on Neon.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to create secondary admin',
      ...(process.env.NODE_ENV !== 'production' ? { code: error.code } : {}),
    });
  }
});

/** Remove a secondary admin (deletes user row; primary admin only). */
router.delete('/sub-admins/:id', async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1 AND COALESCE(is_secondary_admin, FALSE) = TRUE
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Secondary admin not found.',
      });
    }

    return res.json({ success: true, message: 'Secondary admin removed.' });
  } catch (error) {
    console.error('delete sub-admin:', error);
    if (isMissingSecondaryAdminColumn(error)) {
      return res.status(503).json({
        success: false,
        message:
          'Remove secondary admin requires migration 009 (is_secondary_admin). Run backend/migrations/009_add_is_secondary_admin_to_users.sql on Neon.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to remove secondary admin',
      ...(process.env.NODE_ENV !== 'production' ? { code: error.code } : {}),
    });
  }
});

export default router;

