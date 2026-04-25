import pool from '../config/database.js';

/** PostgreSQL: undefined_column */
const PG_UNDEFINED_COLUMN = '42703';

const ME_FIELDS = `id, username, email, mobile, address1, address2, age, gender, state, postal_code, avatar_url, created_at`;
const LOGIN_FIELDS = `${ME_FIELDS}, password`;

/**
 * When migration 009 (is_secondary_admin) is not applied yet, the main SELECT fails.
 * Retrying without that column avoids 500 on login /me /admin for existing databases.
 */
export async function findUserByIdForMe(userId) {
  const withCol = `SELECT ${ME_FIELDS}, COALESCE(is_secondary_admin, FALSE) AS is_secondary_admin FROM users WHERE id = $1`;
  const withoutCol = `SELECT ${ME_FIELDS}, FALSE::boolean AS is_secondary_admin FROM users WHERE id = $1`;
  try {
    return await pool.query(withCol, [userId]);
  } catch (e) {
    if (e.code === PG_UNDEFINED_COLUMN) return pool.query(withoutCol, [userId]);
    throw e;
  }
}

export async function findUserByEmailForLogin(email) {
  const withCol = `SELECT ${LOGIN_FIELDS}, COALESCE(is_secondary_admin, FALSE) AS is_secondary_admin FROM users WHERE LOWER(email) = LOWER($1)`;
  const withoutCol = `SELECT ${LOGIN_FIELDS}, FALSE::boolean AS is_secondary_admin FROM users WHERE LOWER(email) = LOWER($1)`;
  try {
    return await pool.query(withCol, [email]);
  } catch (e) {
    if (e.code === PG_UNDEFINED_COLUMN) return pool.query(withoutCol, [email]);
    throw e;
  }
}

export async function findUserForAdminGate(userId) {
  const withCol = `SELECT id, email, COALESCE(is_secondary_admin, FALSE) AS is_secondary_admin FROM users WHERE id = $1`;
  const withoutCol = `SELECT id, email, FALSE::boolean AS is_secondary_admin FROM users WHERE id = $1`;
  try {
    return await pool.query(withCol, [userId]);
  } catch (e) {
    if (e.code === PG_UNDEFINED_COLUMN) return pool.query(withoutCol, [userId]);
    throw e;
  }
}

export function isMissingSecondaryAdminColumn(error) {
  return error?.code === PG_UNDEFINED_COLUMN && String(error.message || '').includes('is_secondary_admin');
}
