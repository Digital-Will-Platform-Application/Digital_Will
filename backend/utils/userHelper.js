import pool from '../config/database.js';

/**
 * Ensure user exists in backend database
 * By default, this is lookup-only (no auto-create).
 * Auto-create can be enabled explicitly via ALLOW_AUTO_CREATE_USERS=true.
 * @param {string} email - User email
 * @param {string} fullName - User full name (optional)
 * @returns {Promise<number>} - Backend user ID
 */
export async function ensureUserExists(email, fullName = null) {
  try {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length > 0) {
      return userResult.rows[0].id;
    }

    const allowAutoCreate = String(process.env.ALLOW_AUTO_CREATE_USERS || '').toLowerCase() === 'true';
    if (!allowAutoCreate) {
      const err = new Error('User not found. Please register and log in.');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    // User doesn't exist, auto-create (legacy behavior)
    // Generate username from email (before @ symbol)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // Ensure username is unique
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const usernameCheck = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [finalUsername]
      );
      
      if (usernameCheck.rows.length === 0) {
        break; // Username is available
      }
      
      finalUsername = `${username}_${counter}`;
      counter++;
    }

    // Create user with a temporary password (they won't use it since they auth via Supabase)
    // In production, you might want to generate a secure random password
    const tempPassword = 'temp_' + Math.random().toString(36).slice(-12);
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(tempPassword, 10);

    const insertResult = await pool.query(
      `INSERT INTO users (username, email, password, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [finalUsername, email.toLowerCase(), hashedPassword]
    );

    const userId = insertResult.rows[0].id;
    console.log(`✅ Auto-created user in backend database: ${email} (ID: ${userId})`);
    
    return userId;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}
