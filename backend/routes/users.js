import express from 'express';
import pool from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, mobile, address1, address2, age, gender, state, postal_code, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestedId = Number(id);
    const requesterId = Number(req.auth.userId);
    if (!Number.isFinite(requestedId) || requestedId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    if (!req.auth.is_admin && requestedId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await pool.query(
      `SELECT id, username, email, mobile, address1, address2, age, gender, state, postal_code, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [requestedId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

export default router;
