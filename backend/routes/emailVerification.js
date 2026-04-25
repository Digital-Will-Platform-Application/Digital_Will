import express from 'express';
import pool from '../config/database.js';
import { sendVerificationEmail, verifyEmailToken } from '../services/emailVerificationService.js';
import { ensureUserExists } from '../utils/userHelper.js';

const router = express.Router();

// Send verification email
router.post('/send-verification', async (req, res) => {
  try {
    const { user_email, user_id } = req.body;

    console.log('📧 Received verification email request:', { user_email, user_id });

    if (!user_email && !user_id) {
      console.error('❌ Missing both user_email and user_id');
      return res.status(400).json({
        success: false,
        message: 'User email or user ID is required'
      });
    }

    // Validate email format if provided
    if (user_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user_email)) {
        console.error('❌ Invalid email format:', user_email);
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Get or create user
    let userId = user_id;
    let email = user_email;

    if (!userId && email) {
      try {
        userId = await ensureUserExists(email);
      } catch (error) {
        console.error('Error ensuring user exists:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating user account'
        });
      }
    } else if (userId && !email) {
      // Get user email from database
      const userResult = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      email = userResult.rows[0].email;
    }

    // Verify email is set
    if (!email) {
      console.error('❌ Email is required but not found');
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Get user name for email
    const userResult = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    );
    const userName = userResult.rows[0]?.username || null;
    const dbEmail = userResult.rows[0]?.email;

    // Use database email if available and different from provided
    if (dbEmail && dbEmail !== email) {
      console.log(`📧 Using email from database: ${dbEmail} (instead of ${email})`);
      email = dbEmail;
    }

    // Final email validation
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Send verification email
    console.log(`📧 ========================================`);
    console.log(`📧 Route: Sending verification email`);
    console.log(`📧   User ID: ${userId}`);
    console.log(`📧   Email: ${email}`);
    console.log(`📧   User Name: ${userName || 'N/A'}`);
    console.log(`📧 ========================================`);
    
    let result;
    try {
      result = await sendVerificationEmail(userId, email, userName);
      console.log(`📧 Route: Email send result:`, result);
    } catch (error) {
      console.error('❌ Route: Exception in sendVerificationEmail:', error);
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email',
        error: error.message
      });
    }

    if (result && result.success) {
      console.log(`✅ Route: Verification email sent successfully`);
      res.json({
        success: true,
        message: 'Verification email sent successfully',
        data: {
          email: email,
          messageId: result.messageId,
          // Include token in development for testing
          ...(process.env.NODE_ENV === 'development' && { token: result.token })
        }
      });
    } else {
      const errorMsg = result?.error || 'Failed to send verification email';
      const userMessage = result?.message || errorMsg;
      console.error(`❌ Route: Failed to send verification email: ${errorMsg}`);
      
      // Return 200 with success: false if token was created (so user can verify manually)
      // Return 500 if token creation also failed
      const statusCode = result?.token ? 200 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: userMessage,
        error: errorMsg,
        // Include token even on failure if it was created
        ...(result?.token && process.env.NODE_ENV === 'development' && { 
          token: result.token,
          note: 'Email failed but token created. You can verify manually using the token.'
        })
      });
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message
    });
  }
});

// Verify email with token
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Verify token
    const result = await verifyEmailToken(token);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          email: result.email
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
});

// Check verification status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT email, verified_at, created_at
       FROM email_verifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        verified: false,
        message: 'No verification record found'
      });
    }

    const verification = result.rows[0];

    res.json({
      success: true,
      verified: verification.verified_at !== null,
      data: {
        email: verification.email,
        verifiedAt: verification.verified_at,
        createdAt: verification.created_at
      }
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status',
      error: error.message
    });
  }
});

export default router;
