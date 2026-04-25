import express from 'express';
import pool from '../config/database.js';
import { ensureUserExists } from '../utils/userHelper.js';
import { uploadAudioRecording, uploadVideoRecording, isR2Configured } from '../services/r2Storage.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.body.user_id || req.query.user_id;
    const userEmail = req.body.user_email || req.query.user_email;

    if (userId) {
      req.userId = parseInt(userId);
      req.userEmail = null;
      return next();
    }

    if (userEmail) {
      try {
        const userId = await ensureUserExists(userEmail);
        req.userId = userId;
        req.userEmail = userEmail;
        return next();
      } catch (error) {
        console.error('Error ensuring user exists:', error);
        return res.status(500).json({ success: false, message: 'Error creating user account' });
      }
    }

    return res.status(400).json({ success: false, message: 'User ID or email is required' });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Save chat message
router.post('/message', authenticateUser, async (req, res) => {
  try {
    const { role, content, will_id, audio_url, video_url } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'Role and content are required'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "assistant"'
      });
    }

    const userId = req.userId;

    // If will_id is provided, verify it belongs to the user
    let willId = null;
    if (will_id) {
      const willCheck = await pool.query(
        'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
        [will_id, userId]
      );
      if (willCheck.rows.length > 0) {
        willId = willCheck.rows[0].id;
      }
    }

    // Insert chat message
    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, will_id, role, content, audio_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, will_id, role, content, audio_url, video_url, created_at`,
      [userId, willId, role, content, audio_url || null, video_url || null]
    );

    res.json({
      success: true,
      message: 'Chat message saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving chat message',
      error: error.message
    });
  }
});

// Save multiple chat messages (batch)
router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { messages, will_id } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required and must not be empty'
      });
    }

    const userId = req.userId;

    // If will_id is provided, verify it belongs to the user
    let willId = null;
    if (will_id) {
      const willCheck = await pool.query(
        'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
        [will_id, userId]
      );
      if (willCheck.rows.length > 0) {
        willId = willCheck.rows[0].id;
      }
    }

    // Insert all messages in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedMessages = [];
      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          throw new Error('Each message must have role and content');
        }
        if (!['user', 'assistant'].includes(msg.role)) {
          throw new Error('Role must be either "user" or "assistant"');
        }

        const result = await client.query(
          `INSERT INTO chat_messages (user_id, will_id, role, content, audio_url, video_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, user_id, will_id, role, content, audio_url, video_url, created_at`,
          [
            userId,
            willId,
            msg.role,
            msg.content,
            msg.audio_url || null,
            msg.video_url || null
          ]
        );
        insertedMessages.push(result.rows[0]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `${insertedMessages.length} chat messages saved successfully`,
        data: insertedMessages
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving chat messages',
      error: error.message
    });
  }
});

// Get chat messages for a user or will
router.get('/messages', async (req, res) => {
  try {
    const { will_id, user_id, user_email } = req.query;
    
    // Get user ID
    let userId;
    if (user_id) {
      userId = parseInt(user_id);
    } else if (user_email) {
      try {
        userId = await ensureUserExists(user_email);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user email'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    let query;
    let params;

    if (will_id) {
      // Verify will belongs to user
      const willCheck = await pool.query(
        'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
        [will_id, userId]
      );
      if (willCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Will not found'
        });
      }

      query = `SELECT id, user_id, will_id, role, content, audio_url, video_url, created_at
               FROM chat_messages
               WHERE will_id = $1
               ORDER BY created_at ASC`;
      params = [will_id];
    } else {
      query = `SELECT id, user_id, will_id, role, content, audio_url, video_url, created_at
               FROM chat_messages
               WHERE user_id = $1
               ORDER BY created_at ASC`;
      params = [userId];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat messages',
      error: error.message
    });
  }
});

// Upload audio file for chat message
router.post('/upload-audio', upload.single('audio'), authenticateUser, async (req, res) => {
  try {
    if (!isR2Configured()) {
      return res.status(500).json({
        success: false,
        message: 'R2 storage is not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const userId = req.userId;
    const { will_id } = req.body;
    const useStaging = req.body.staging === 'true' || process.env.NODE_ENV !== 'production';

    // Upload to R2
    const uploadResult = await uploadAudioRecording(
      req.file.buffer,
      userId,
      useStaging,
      { originalName: req.file.originalname, contentType: req.file.mimetype }
    );

    // If will_id is provided, verify it belongs to the user
    let willId = null;
    if (will_id) {
      const willCheck = await pool.query(
        'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
        [will_id, userId]
      );
      if (willCheck.rows.length > 0) {
        willId = willCheck.rows[0].id;
      }
    }

    res.json({
      success: true,
      message: 'Audio uploaded successfully',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        will_id: willId
      }
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading audio',
      error: error.message
    });
  }
});

// Upload video file for chat message
router.post('/upload-video', upload.single('video'), authenticateUser, async (req, res) => {
  try {
    if (!isR2Configured()) {
      return res.status(500).json({
        success: false,
        message: 'R2 storage is not configured'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const userId = req.userId;
    const { will_id } = req.body;
    const useStaging = req.body.staging === 'true' || process.env.NODE_ENV !== 'production';

    // Upload to R2
    const uploadResult = await uploadVideoRecording(
      req.file.buffer,
      userId,
      useStaging,
      { originalName: req.file.originalname, contentType: req.file.mimetype }
    );

    // If will_id is provided, verify it belongs to the user
    let willId = null;
    if (will_id) {
      const willCheck = await pool.query(
        'SELECT id FROM wills WHERE id = $1 AND user_id = $2',
        [will_id, userId]
      );
      if (willCheck.rows.length > 0) {
        willId = willCheck.rows[0].id;
      }
    }

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        will_id: willId
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message
    });
  }
});

export default router;
