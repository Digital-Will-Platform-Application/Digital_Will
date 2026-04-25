import express from 'express';
import pool from '../config/database.js';
import { sendRecipientAddedEmail } from '../services/emailService.js';
import multer from 'multer';
import { uploadToR2, isR2Configured } from '../services/r2Storage.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Add a new recipient
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { full_name, email, phone, relationship, address, image_url } = req.body;
    const userId = req.auth.userId;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    const result = await pool.query(
      `INSERT INTO recipients (user_id, full_name, email, phone, relationship, address, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        full_name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        relationship || null,
        address || null,
        image_url || null
      ]
    );

    const recipient = result.rows[0];

    // Send email notification if email is provided
    if (email && email.trim()) {
      try {
        // Get creator name
        const userResult = await pool.query(
          'SELECT username, email FROM users WHERE id = $1',
          [userId]
        );
        const creatorName = userResult.rows[0]?.username || 'the will creator';

        const emailResult = await sendRecipientAddedEmail(
          email.trim(),
          full_name.trim(),
          creatorName
        );

        if (emailResult.success) {
          console.log(`✅ Recipient added email sent to ${email}`);
        } else {
          console.warn(`⚠️ Failed to send recipient added email: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('Error sending recipient added email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Recipient added successfully',
      data: recipient
    });
  } catch (error) {
    console.error('Error adding recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding recipient',
      error: error.message
    });
  }
});

// Upload recipient profile image to R2
router.post('/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided (field name: image)' });
    }
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Unsupported image format' });
    }
    if (!isR2Configured()) {
      return res.status(500).json({ success: false, message: 'R2 storage is not configured' });
    }

    const userId = req.auth.userId;
    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `recipients/${userId}/recipient-${Date.now()}.${ext || 'jpg'}`;
    const useStaging = req.body.staging === 'true' || process.env.NODE_ENV !== 'production';
    const uploadResult = await uploadToR2(req.file.buffer, key, req.file.mimetype, useStaging);

    return res.json({
      success: true,
      message: 'Recipient image uploaded successfully',
      data: {
        image_url: uploadResult.url,
        upload: uploadResult,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error uploading recipient image',
      error: error.message,
    });
  }
});

// Get all recipients for a user
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await pool.query(
      `SELECT id, user_id, full_name, email, phone, relationship, address, is_verified, image_url, created_at, updated_at
       FROM recipients
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipients',
      error: error.message
    });
  }
});

// Get recipients by user email
router.get('/user-email/:userEmail', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const result = await pool.query(
      `SELECT id, user_id, full_name, email, phone, relationship, address, is_verified, image_url, created_at, updated_at
       FROM recipients
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipients',
      error: error.message
    });
  }
});

// Update a recipient
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, relationship, address } = req.body;
    const userId = req.auth.userId;

    const result = await pool.query(
      `UPDATE recipients
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           relationship = COALESCE($4, relationship),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        full_name?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        relationship || null,
        address || null,
        id,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipient updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recipient',
      error: error.message
    });
  }
});

// Delete a recipient
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    const result = await pool.query(
      'DELETE FROM recipients WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recipient',
      error: error.message
    });
  }
});

export default router;
