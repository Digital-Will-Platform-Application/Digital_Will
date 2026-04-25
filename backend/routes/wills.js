import express from 'express';
import pool from '../config/database.js';
import { ensureUserExists } from '../utils/userHelper.js';

const router = express.Router();

// Middleware to extract user ID from JWT (simplified - in production use proper JWT verification)
const authenticateUser = async (req, res, next) => {
  try {
    // Accept either user_id or user_email
    const userId = req.body.user_id || req.query.user_id;
    const userEmail = req.body.user_email || req.query.user_email;
    
    // If we have user_id, use it directly
    if (userId) {
      req.userId = parseInt(userId);
      req.userEmail = null;
      return next();
    }
    
    // If we have user_email, ensure user exists (auto-create if needed)
    if (userEmail) {
      try {
        const userId = await ensureUserExists(userEmail);
        req.userId = userId;
        req.userEmail = userEmail;
        return next();
      } catch (error) {
        console.error('Error ensuring user exists:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating user account'
        });
      }
    }
    
    // Neither provided
    return res.status(400).json({
      success: false,
      message: 'User ID or email is required'
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Save or update will (chat conversation)
router.post('/save', authenticateUser, async (req, res) => {
  try {
    const { transcript, content, title, type, notes } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'Transcript is required'
      });
    }

    // Use userId from middleware (already looked up from user_email or user_id)
    const userId = req.userId;

    // Check for existing chat will
    const existingCheck = await pool.query(
      'SELECT id FROM wills WHERE user_id = $1 AND type = $2',
      [userId, type || 'chat']
    );

    let will;
    if (existingCheck.rows.length > 0) {
      // Update existing will
      const result = await pool.query(
        `UPDATE wills 
         SET transcript = $1, content = $2, status = 'in_progress', updated_at = CURRENT_TIMESTAMP,
            title = COALESCE($3, title), notes = COALESCE($4, notes)
        WHERE id = $5
        RETURNING id, user_id, title, type, status, transcript, content, notes, created_at, updated_at`,
        [transcript, content || transcript, title, notes, existingCheck.rows[0].id]
      );
      will = result.rows[0];
    } else {
      // Create new will
      const result = await pool.query(
        `INSERT INTO wills (user_id, title, type, transcript, content, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'in_progress')
         RETURNING id, user_id, title, type, status, transcript, content, notes, created_at, updated_at`,
        [userId, title || 'My Chat-Based Will', type || 'chat', transcript, content || transcript, notes || null]
      );
      will = result.rows[0];
    }

    res.json({
      success: true,
      message: 'Will saved successfully',
      data: will
    });
  } catch (error) {
    console.error('Error saving will:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving will',
      error: error.message
    });
  }
});

// Get user's will
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT id, user_id, title, type, status, content, transcript, audio_url, video_url, notes, created_at, updated_at
       FROM wills 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No will found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching will:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching will',
      error: error.message
    });
  }
});

// Get user's will by email
router.get('/user-email/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const userId = await ensureUserExists(userEmail);
    
    const result = await pool.query(
      `SELECT id, user_id, title, type, status, content, transcript, audio_url, video_url, notes, created_at, updated_at
       FROM wills 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No will found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching will:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching will',
      error: error.message
    });
  }
});

// List all wills for a user (Neon). Must be registered before GET /:id so "list" is not parsed as an id.
router.get('/list', async (req, res) => {
  try {
    const userIdParam = req.query.user_id;
    const userEmail = req.query.user_email;

    let userId = null;
    if (userIdParam !== undefined && userIdParam !== '') {
      userId = parseInt(String(userIdParam), 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user_id',
        });
      }
    } else if (userEmail && String(userEmail).trim()) {
      userId = await ensureUserExists(String(userEmail).trim().toLowerCase());
    } else {
      return res.status(400).json({
        success: false,
        message: 'user_id or user_email is required',
      });
    }

    const result = await pool.query(
      `SELECT id, user_id, title, type, status, content, transcript, audio_url, video_url, notes, created_at, updated_at
       FROM wills
       WHERE user_id = $1
       ORDER BY updated_at DESC NULLS LAST, created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error listing wills:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listing wills',
      error: error.message,
    });
  }
});

// Delete a will (scoped to user)
router.delete('/:id', async (req, res) => {
  try {
    const willId = parseInt(req.params.id, 10);
    if (Number.isNaN(willId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid will ID',
      });
    }

    const userIdParam = req.query.user_id;
    const userEmail = req.query.user_email;

    let userId = null;
    if (userIdParam !== undefined && userIdParam !== '') {
      userId = parseInt(String(userIdParam), 10);
      if (Number.isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user_id',
        });
      }
    } else if (userEmail && String(userEmail).trim()) {
      userId = await ensureUserExists(String(userEmail).trim().toLowerCase());
    } else {
      return res.status(400).json({
        success: false,
        message: 'user_id or user_email is required',
      });
    }

    const result = await pool.query(
      'DELETE FROM wills WHERE id = $1 AND user_id = $2 RETURNING id',
      [willId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Will not found or access denied',
      });
    }

    return res.json({
      success: true,
      message: 'Will deleted',
    });
  } catch (error) {
    console.error('Error deleting will:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting will',
      error: error.message,
    });
  }
});

// Get will by ID (scoped to user by user_id or user_email)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userIdParam = req.query.user_id;
    const userEmail = req.query.user_email;

    let userId = null;
    if (userIdParam) {
      userId = parseInt(userIdParam, 10);
    } else if (userEmail) {
      userId = await ensureUserExists(userEmail);
    }

    const willId = parseInt(id, 10);
    if (isNaN(willId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid will ID'
      });
    }

    const query = userId
      ? `SELECT id, user_id, title, type, status, content, transcript, audio_url, video_url, notes, created_at, updated_at
         FROM wills
         WHERE id = $1 AND user_id = $2
         LIMIT 1`
      : `SELECT id, user_id, title, type, status, content, transcript, audio_url, video_url, notes, created_at, updated_at
         FROM wills
         WHERE id = $1
         LIMIT 1`;

    const values = userId ? [willId, userId] : [willId];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Will not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching will by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching will',
      error: error.message
    });
  }
});

// Finalize will
router.post('/finalize', authenticateUser, async (req, res) => {
  try {
    const { will_id } = req.body;

    // Use userId from middleware (already looked up)
    const userId = req.userId;

    // If will_id is provided, try to use it
    // Otherwise, get the most recent will for this user
    let will;
    if (will_id) {
      // Try to parse as integer (backend ID) or use as-is
      const willIdInt = parseInt(will_id);
      if (!isNaN(willIdInt)) {
        // It's a backend integer ID
        const result = await pool.query(
          `UPDATE wills 
           SET status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2
           RETURNING id, user_id, title, type, status, created_at, updated_at`,
          [willIdInt, userId]
        );
        will = result.rows[0];
      }
    }

    // If will not found by ID, get the most recent will for this user
    if (!will) {
      // First get the most recent will ID (including completed ones, then update the latest)
      const findResult = await pool.query(
        `SELECT id FROM wills 
         WHERE user_id = $1
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 1`,
        [userId]
      );
      
      if (findResult.rows.length > 0) {
        const willId = findResult.rows[0].id;
        // Then update it
        const result = await pool.query(
          `UPDATE wills 
           SET status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2
           RETURNING id, user_id, title, type, status, created_at, updated_at`,
          [willId, userId]
        );
        will = result.rows[0];
      } else {
        // No will found at all - create a placeholder will
        console.log(`No will found for user ${userId}, creating placeholder will`);
        const createResult = await pool.query(
          `INSERT INTO wills (user_id, title, type, status)
           VALUES ($1, 'My Will', 'text', 'completed')
           RETURNING id, user_id, title, type, status, created_at, updated_at`,
          [userId]
        );
        will = createResult.rows[0];
      }
    }

    if (!will) {
      return res.status(404).json({
        success: false,
        message: 'Will not found. Please create a will first.'
      });
    }

    res.json({
      success: true,
      message: 'Will finalized successfully',
      data: will
    });
  } catch (error) {
    console.error('Error finalizing will:', error);
    res.status(500).json({
      success: false,
      message: 'Error finalizing will',
      error: error.message
    });
  }
});

export default router;
