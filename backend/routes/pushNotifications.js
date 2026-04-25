import express from 'express';
import pool from '../config/database.js';
import { ensureUserExists } from '../utils/userHelper.js';

const router = express.Router();

// Store FCM tokens (in production, use a proper database table)
const fcmTokens = new Map();

// Register FCM token for push notifications
router.post('/register-token', async (req, res) => {
  try {
    const { user_email, fcm_token, platform } = req.body;

    if (!user_email || !fcm_token) {
      return res.status(400).json({
        success: false,
        message: 'User email and FCM token are required'
      });
    }

    const userId = await ensureUserExists(user_email);
    
    // Store token (in production, save to database)
    const key = `${userId}_${platform || 'unknown'}`;
    fcmTokens.set(key, {
      userId,
      userEmail: user_email,
      fcmToken: fcm_token,
      platform: platform || 'unknown',
      updatedAt: new Date()
    });

    console.log(`✅ FCM token registered for user ${user_email}`);

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering FCM token',
      error: error.message
    });
  }
});

// Send push notification (helper endpoint - in production, use Firebase Admin SDK)
router.post('/send', async (req, res) => {
  try {
    const { user_email, title, body, data } = req.body;

    if (!user_email || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User email, title, and body are required'
      });
    }

    const userId = await ensureUserExists(user_email);
    
    // Find FCM token for user
    let token = null;
    for (const [key, value] of fcmTokens.entries()) {
      if (value.userId === userId || value.userEmail === user_email) {
        token = value.fcmToken;
        break;
      }
    }

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'FCM token not found for user'
      });
    }

    // In production, use Firebase Admin SDK to send push notification
    // For now, we'll just log it
    console.log(`📱 Push notification queued for ${user_email}:`, { title, body, data });

    res.json({
      success: true,
      message: 'Push notification queued',
      data: { title, body, data }
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending push notification',
      error: error.message
    });
  }
});

export default router;
