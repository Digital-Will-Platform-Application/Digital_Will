import express from 'express';
import pool from '../config/database.js';
import { ensureUserExists } from '../utils/userHelper.js';
import multer from 'multer';
import { uploadToR2, isR2Configured } from '../services/r2Storage.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Update user profile (avatar_url, full_name)
router.post('/update', async (req, res) => {
  try {
    const { user_email, avatar_url, full_name, mobile } = req.body;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    // Ensure user exists in backend database
    const userId = await ensureUserExists(user_email);

    // Note: This updates the backend users table
    // For Supabase profiles, we'll need to handle that separately
    // For now, let's create a mapping or update both
    
    // Update backend users table if we have those fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      updateValues.push(full_name || null);
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      updateValues.push(avatar_url || null);
    }

    if (mobile !== undefined) {
      updateFields.push(`mobile = $${paramIndex++}`);
      updateValues.push(mobile != null && String(mobile).trim() ? String(mobile).trim() : null);
    }

    if (updateFields.length > 0) {
      updateValues.push(userId);
      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING id, username, email, avatar_url, mobile
      `;
      
      const updated = await pool.query(updateQuery, updateValues);
      const row = updated.rows[0];
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user_id: row.id,
          avatar_url: row.avatar_url || null,
          full_name: row.username || null,
          mobile: row.mobile || null,
        }
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user_id: userId,
        avatar_url: avatar_url || null,
        full_name: full_name || null,
        mobile: mobile ?? null,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Upload profile photo to R2 and save URL to NeonDB
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userEmail = req.body.user_email;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided (field name: avatar)' });
    }

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Unsupported image format' });
    }

    if (!isR2Configured()) {
      return res.status(500).json({ success: false, message: 'R2 storage is not configured' });
    }

    const userId = await ensureUserExists(userEmail);
    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `avatars/${userId}/avatar-${Date.now()}.${ext || 'jpg'}`;
    const useStaging = req.body.staging === 'true' || process.env.NODE_ENV !== 'production';

    const uploadResult = await uploadToR2(req.file.buffer, key, req.file.mimetype, useStaging);

    const updated = await pool.query(
      `UPDATE users
       SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, avatar_url`,
      [uploadResult.url, userId]
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user: updated.rows[0],
        upload: uploadResult,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar',
      error: error.message,
    });
  }
});

export default router;
