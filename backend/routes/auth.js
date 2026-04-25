import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { sendJwtAuthError, sendMissingToken, sendMalformedToken } from '../utils/jwtAuthError.js';
import { findUserByIdForMe, findUserByEmailForLogin } from '../utils/userQueries.js';
import { getJwtSecretOrRespond } from '../utils/jwtConfig.js';

const router = express.Router();

function isAdminEmail(email) {
  const configured = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!configured) return false;
  return String(email || '').trim().toLowerCase() === configured;
}

function buildAuthUserFlags(userRow) {
  const is_super_admin = isAdminEmail(userRow.email);
  // Primary (ADMIN_EMAIL) must never be treated as secondary even if the column was set by mistake.
  const is_secondary = Boolean(userRow.is_secondary_admin) && !is_super_admin;
  const is_admin = is_super_admin || is_secondary;
  return { is_super_admin, is_admin };
}

function toAuthUserPayload(userRow) {
  const flags = buildAuthUserFlags(userRow);
  return {
    id: userRow.id,
    username: userRow.username,
    email: userRow.email,
    mobile: userRow.mobile,
    address1: userRow.address1,
    address2: userRow.address2,
    age: userRow.age,
    gender: userRow.gender,
    state: userRow.state,
    postal_code: userRow.postal_code,
    avatar_url: userRow.avatar_url || null,
    created_at: userRow.created_at,
    is_super_admin: flags.is_super_admin,
    is_admin: flags.is_admin,
  };
}

function accessTokenExpiresIn() {
  return process.env.JWT_ACCESS_EXPIRES_IN || '1h';
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Return current user (used to refresh role after reload)
router.get('/me', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return sendMissingToken(res);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) return sendMalformedToken(res);

    const result = await findUserByIdForMe(userId);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const user = result.rows[0];

    return res.json({
      success: true,
      data: {
        user: toAuthUserPayload(user),
      },
    });
  } catch (error) {
    return sendJwtAuthError(res, error);
  }
});

/**
 * Permanently delete the authenticated user's row in Postgres (Neon). Cascaded rows (wills, assets,
 * recipients, chat_messages, email_verifications, etc.) are removed via ON DELETE CASCADE.
 * Requires current password. Primary admin email (ADMIN_EMAIL) cannot self-delete.
 *
 * Exposed as POST /delete-account (preferred for JSON body reliability) and DELETE /account.
 */
async function deleteAccountHandler(req, res) {
  try {
    const token = getBearerToken(req);
    if (!token) return sendMissingToken(res);

    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (e) {
      return sendJwtAuthError(res, e);
    }

    const userId = decoded?.userId;
    if (!userId) return sendMalformedToken(res);

    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete your account.',
      });
    }

    const me = await findUserByIdForMe(userId);
    if (me.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await findUserByEmailForLogin(me.rows[0].email);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const row = result.rows[0];
    if (Number(row.id) !== Number(userId)) {
      return res.status(401).json({ success: false, message: 'Session does not match account.' });
    }

    if (isAdminEmail(row.email)) {
      return res.status(403).json({
        success: false,
        message: 'Primary administrator accounts cannot be deleted from the app.',
      });
    }

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password.',
      });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return res.json({
      success: true,
      message: 'Your account and associated data have been removed.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      message: dev
        ? error?.message || 'Could not delete account.'
        : 'Could not delete account. Try again or contact support.',
      ...(dev ? { code: error?.code } : {}),
    });
  }
}

router.post('/delete-account', deleteAccountHandler);
router.delete('/account', deleteAccountHandler);

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      mobile,
      password,
      confirm_password,
      address1,
      address2,
      age,
      gender,
      state,
      postal_code
    } = req.body;

    // Validation
    if (!username || !email || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and confirm password are required'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists (case-insensitive)
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Block public registration for admin email (admin must be created intentionally)
    if (isAdminEmail(email)) {
      return res.status(403).json({
        success: false,
        message: 'This email is reserved for administration.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, mobile, password, address1, address2, age, gender, state, postal_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, username, email, mobile, address1, address2, age, gender, state, postal_code, avatar_url, created_at`,
      [username, email, mobile || null, hashedPassword, address1 || null, address2 || null, age || null, gender || null, state || null, postal_code || null]
    );

    const user = result.rows[0];

    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;

    const claims = {
      userId: user.id,
      email: user.email,
      is_admin: false,
      is_super_admin: false,
    };
    const token = jwt.sign(claims, jwtSecret, { expiresIn: accessTokenExpiresIn() });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: toAuthUserPayload({ ...user, is_secondary_admin: false }),
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      message: dev
        ? error?.message || 'Registration could not be completed.'
        : 'Registration could not be completed. Try again or contact support.',
      ...(dev ? { error: error.message, code: error.code } : {}),
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await findUserByEmailForLogin(email);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;

    const flags = buildAuthUserFlags(user);
    const claims = {
      userId: user.id,
      email: user.email,
      is_admin: flags.is_admin,
      is_super_admin: flags.is_super_admin,
    };
    const token = jwt.sign(claims, jwtSecret, { expiresIn: accessTokenExpiresIn() });

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: toAuthUserPayload(user),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      message: dev
        ? error?.message || 'Login could not be completed.'
        : 'Login could not be completed. Check database connection or try again later.',
      ...(dev ? { error: error.message, code: error.code } : {}),
    });
  }
});

// Change password (NeonDB users table)
router.post('/change-password', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return sendMissingToken(res);
    const jwtSecret = getJwtSecretOrRespond(res);
    if (!jwtSecret) return;
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded?.userId;
    if (!userId) return sendMalformedToken(res);

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const result = await pool.query(
      'SELECT id, password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const row = result.rows[0];
    const isValid = await bcrypt.compare(current_password, row.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashed = await bcrypt.hash(String(new_password), 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashed, row.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
});

export default router;
