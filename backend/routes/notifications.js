import express from 'express';
import pool from '../config/database.js';
import { sendWillNotificationEmail, saveEmailNotification } from '../services/emailService.js';
import { ensureUserExists } from '../utils/userHelper.js';

const router = express.Router();

// Send email notifications for finalized will
router.post('/send-will-notifications', async (req, res) => {
  try {
    const { will_id, user_id, user_email, recipients } = req.body;

    if (!will_id) {
      return res.status(400).json({
        success: false,
        message: 'Will ID is required'
      });
    }

    // Get user ID - either from user_id or look up by email (auto-create if needed)
    let userId = user_id;
    if (!userId && user_email) {
      try {
        userId = await ensureUserExists(user_email);
      } catch (error) {
        console.error('Error ensuring user exists:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating user account'
        });
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID or email is required'
      });
    }

    // Get will details
    const willResult = await pool.query(
      'SELECT id, title, type FROM wills WHERE id = $1 AND user_id = $2',
      [will_id, userId]
    );

    if (willResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Will not found'
      });
    }

    const will = willResult.rows[0];

    // If recipients are provided in request, use them; otherwise fetch from database
    let recipientList = recipients;
    if (!recipientList || recipientList.length === 0) {
      // In a full implementation, you'd fetch recipients from a recipients table
      // For now, we'll use the provided list or return empty
      recipientList = [];
    }

    const results = {
      sent: 0,
      failed: 0,
      total: recipientList.length
    };

    // Send emails to all recipients
    for (const recipient of recipientList) {
      if (!recipient.email) continue;

      try {
        const emailResult = await sendWillNotificationEmail(
          recipient.email,
          recipient.name || recipient.full_name,
          will.title,
          will.type
        );

        if (emailResult.success) {
          await saveEmailNotification(
            will.id,
            recipient.email,
            recipient.name || recipient.full_name,
            `Will Finalized: ${will.title}`,
            'sent'
          );
          results.sent++;
        } else {
          await saveEmailNotification(
            will.id,
            recipient.email,
            recipient.name || recipient.full_name,
            `Will Finalized: ${will.title}`,
            'failed',
            emailResult.error
          );
          results.failed++;
        }
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        await saveEmailNotification(
          will.id,
          recipient.email,
          recipient.name || recipient.full_name,
          `Will Finalized: ${will.title}`,
          'failed',
          error.message
        );
        results.failed++;
      }
    }

    res.json({
      success: true,
      message: `Email notifications processed: ${results.sent} sent, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
});

// Get email notifications for a will
router.get('/will/:willId', async (req, res) => {
  try {
    const { willId } = req.params;
    const result = await pool.query(
      `SELECT id, will_id, recipient_email, recipient_name, subject, status, sent_at, error_message, created_at
       FROM email_notifications 
       WHERE will_id = $1
       ORDER BY created_at DESC`,
      [willId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

export default router;
