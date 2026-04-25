import crypto from 'crypto';
import pool from '../config/database.js';
import { sendEmail } from './emailService.js';

const EMAIL_FROM = process.env.EMAIL_FROM || 'LegacyWallet <noreply@legacywallet.com>';
// Support multiple frontend URLs - check for web frontend first, then mobile
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Generate verification token
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create verification token in database
export async function createVerificationToken(userId, email) {
  try {
    // Delete any existing unverified tokens for this user/email
    await pool.query(
      'DELETE FROM email_verifications WHERE user_id = $1 AND email = $2 AND verified_at IS NULL',
      [userId, email]
    );

    // Generate new token
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Insert token
    const result = await pool.query(
      `INSERT INTO email_verifications (user_id, email, token, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, token, expires_at, created_at`,
      [userId, email, token, expiresAt]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating verification token:', error);
    throw error;
  }
}

// Send verification email
export async function sendVerificationEmail(userId, email, userName = null) {
  try {
    console.log(`📧 sendVerificationEmail called for userId: ${userId}, email: ${email}`);
    console.log(`📧 FRONTEND_URL: ${FRONTEND_URL}`);
    
    // Validate inputs
    if (!userId || !email) {
      const error = 'User ID and email are required';
      console.error(`❌ ${error}`);
      return { success: false, error };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = 'Invalid email format';
      console.error(`❌ ${error}: ${email}`);
      return { success: false, error };
    }

    // Create verification token
    console.log('📧 Creating verification token...');
    let verification;
    try {
      verification = await createVerificationToken(userId, email);
      console.log(`✅ Verification token created: ${verification.token.substring(0, 8)}...`);
    } catch (tokenError) {
      console.error('❌ Error creating verification token:', tokenError);
      return { 
        success: false, 
        error: `Failed to create verification token: ${tokenError.message}` 
      };
    }
    
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verification.token}`;
    console.log(`📧 Verification URL: ${verificationUrl}`);

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">Verify Your Email Address</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello ${userName || 'User'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for registering with LegacyWallet! Please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #d4af37; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #999; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This verification link will expire in 24 hours.
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 30px 0 0 0;">
              If you didn't create an account with LegacyWallet, please ignore this email.<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via SMTP (or Resend as fallback)
    console.log(`📧 Attempting to send verification email to: ${email}`);
    console.log(`📧 Email service configured: Checking SMTP and Resend...`);
    
    let emailResult;
    try {
      emailResult = await sendEmail(
        email,
        'Verify Your Email Address - LegacyWallet',
        emailHtml
      );
    } catch (emailError) {
      console.error('❌ Exception while sending email:', emailError);
      console.error('❌ Error stack:', emailError.stack);
      return {
        success: false,
        error: `Email sending failed: ${emailError.message}`
      };
    }

    console.log(`📧 Email send result:`, emailResult);

    if (emailResult && emailResult.success) {
      console.log(`✅ Verification email sent successfully to ${email}`);
      console.log(`📧 Message ID: ${emailResult.messageId || 'N/A'}`);
      return {
        success: true,
        message: 'Verification email sent successfully',
        token: verification.token, // Return token for testing
        messageId: emailResult.messageId
      };
    } else {
      const errorMsg = emailResult?.error || 'Failed to send verification email';
      console.error(`❌ Failed to send verification email to ${email}`);
      console.error(`❌ Error: ${errorMsg}`);
      console.error(`💡 Make sure SMTP_USER, SMTP_PASS, or RESEND_API_KEY is set in .env`);
      console.error(`💡 For Gmail, use an App Password (see GMAIL_SMTP_SETUP.md)`);
      
      // Still return the token so user can verify manually if needed
      return {
        success: false,
        error: errorMsg,
        token: verification.token, // Return token even on failure for manual verification
        message: 'Email sending failed, but verification token was created. Check email configuration.'
      };
    }
  } catch (error) {
    console.error('❌ Exception in sendVerificationEmail:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while sending verification email'
    };
  }
}

// Verify email token
export async function verifyEmailToken(token) {
  try {
    // Find token
    const result = await pool.query(
      `SELECT id, user_id, email, expires_at, verified_at
       FROM email_verifications
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid verification token'
      };
    }

    const verification = result.rows[0];

    // Check if already verified
    if (verification.verified_at) {
      return {
        success: false,
        error: 'Email already verified'
      };
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Verification token has expired'
      };
    }

    // Mark as verified
    await pool.query(
      `UPDATE email_verifications
       SET verified_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [verification.id]
    );

    // Update user's email verification status (if you have this column)
    // For now, we'll just mark the verification as complete
    // You can add an email_verified column to users table if needed

    console.log(`✅ Email verified for user ${verification.user_id} (${verification.email})`);

    return {
      success: true,
      message: 'Email verified successfully',
      userId: verification.user_id,
      email: verification.email
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
