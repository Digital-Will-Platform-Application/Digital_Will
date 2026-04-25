import pool from '../config/database.js';
import nodemailer from 'nodemailer';

// Email service: Resend API (recommended on Render) and/or SMTP (e.g. Gmail)
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = process.env.EMAIL_FROM || 'LegacyWallet <noreply@legacywallet.com>';

/** Resend only accepts verified domains or their test sender — not arbitrary noreply@yourdomain until verified. */
function getResendFrom() {
  const custom = (process.env.RESEND_FROM || '').trim();
  if (custom) return custom;
  return 'LegacyWallet <onboarding@resend.dev>';
}

function isResendConfigured() {
  if (!RESEND_API_KEY) return false;
  const placeholders = new Set([
    're_your_api_key_here',
    're_your_resend_api_key_here',
    'your_resend_api_key',
    'changeme',
  ]);
  if (placeholders.has(RESEND_API_KEY.toLowerCase())) return false;
  return RESEND_API_KEY.startsWith('re_');
}

// SMTP Configuration
const SMTP_SERVICE = process.env.SMTP_SERVICE || 'gmail';
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL;
// Remove spaces from App Password (Gmail App Passwords may have spaces)
const SMTP_PASS = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');

// Create nodemailer transporter
let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  try {
    const smtpConfig = {
      service: SMTP_SERVICE === 'gmail' ? 'gmail' : undefined,
      host: SMTP_HOST || (SMTP_SERVICE === 'gmail' ? 'smtp.gmail.com' : undefined),
      port: SMTP_PORT || (SMTP_SERVICE === 'gmail' ? 587 : 587),
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    };

    // Remove undefined values
    Object.keys(smtpConfig).forEach(key => {
      if (smtpConfig[key] === undefined) {
        delete smtpConfig[key];
      }
    });

    transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection (non-blocking, so server can start even if SMTP fails)
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP connection verification failed:', error.message);
        if (error.message.includes('Invalid login') || error.message.includes('535') || error.message.includes('BadCredentials')) {
          console.error('💡 Gmail SMTP Error: You need to use an App Password, not your regular password.');
          console.error('💡 See backend/GMAIL_SMTP_SETUP.md for instructions.');
          console.error('💡 Current SMTP_USER:', SMTP_USER);
          console.error('💡 Make sure SMTP_PASS is a 16-character App Password from Google.');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
          console.error('💡 SMTP Connection Error: Cannot connect to SMTP server.');
          console.error('💡 Check SMTP_HOST and SMTP_PORT in .env');
          console.error('💡 For Gmail: smtp.gmail.com:587');
        } else {
          console.error('💡 SMTP Error Details:', error);
        }
        console.error('💡 The server will continue running, but emails will fail until SMTP is fixed.');
        // Don't set transporter to null - let it try anyway, might work for some operations
      } else {
        console.log('✅ SMTP transporter configured and verified');
        console.log('✅ Ready to send emails via SMTP');
      }
    });
  } catch (error) {
    console.error('❌ Failed to create SMTP transporter:', error);
  }
} else {
  console.warn('⚠️ SMTP not configured. Set SMTP_USER and SMTP_PASS in .env');
}

// Send email using SMTP (nodemailer)
async function sendEmailViaSMTP(to, subject, html) {
  if (!transporter) {
    return { success: false, error: 'SMTP not configured. Please set SMTP_USER and SMTP_PASS in .env' };
  }

  try {
    const mailOptions = {
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      html: html,
    };

    console.log(`📧 Sending email via SMTP to: ${to}`);
    console.log(`📧 From: ${EMAIL_FROM}`);
    console.log(`📧 Subject: ${subject}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via SMTP');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email via SMTP:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error details:', error);
    
    let errorMessage = error.message;
    if (error.message.includes('Invalid login') || error.message.includes('535') || error.message.includes('BadCredentials')) {
      errorMessage = 'SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS. For Gmail, use an App Password.';
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      errorMessage = 'Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
    }
    
    return { success: false, error: errorMessage };
  }
}

// Send email using Resend API
export async function sendEmailViaResend(to, subject, html) {
  if (!isResendConfigured()) {
    const errorMsg =
      'Resend API key not configured. Set RESEND_API_KEY in the server environment (Render → legacy-wallet-backend → Environment). Get a key at https://resend.com';
    console.error('❌', errorMsg);
    return { success: false, error: errorMsg };
  }

  const from = getResendFrom();

  try {
    console.log('📧 Sending email via Resend API to:', to);
    console.log('📧 From:', from, '(set RESEND_FROM for your verified domain)');
    console.log('📧 Subject:', subject);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const responseText = await response.text();
    console.log('📧 Resend API response status:', response.status);
    console.log('📧 Resend API response:', responseText);

    if (!response.ok) {
      let errorMessage = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || responseText;
      } catch {
        // If not JSON, use the text as-is
      }
      console.error('❌ Resend API error:', response.status, errorMessage);
      
      // Provide helpful error messages
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Invalid Resend API key. Please check your RESEND_API_KEY in .env';
      } else if (response.status === 422) {
        errorMessage = `Invalid email configuration: ${errorMessage}`;
      }
      
      return { success: false, error: errorMessage };
    }

    const result = JSON.parse(responseText);
    console.log('✅ Email sent successfully via Resend');
    console.log('📧 Message ID:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    console.error('❌ Error details:', error.message, error.stack);
    return { success: false, error: `Resend API error: ${error.message}` };
  }
}

// Main email sending function — Resend first (HTTPS, works well on Render), then SMTP
export async function sendEmail(to, subject, html) {
  console.log(`📧 ========================================`);
  console.log(`📧 Attempting to send email to: ${to}`);
  console.log(`📧 SMTP configured: ${transporter ? 'Yes ✅' : 'No ❌'}`);
  const resendOk = isResendConfigured();
  console.log(`📧 Resend configured: ${resendOk ? 'Yes ✅' : 'No ❌'}`);
  console.log(`📧 ========================================`);

  if (resendOk) {
    console.log('📧 [1/2] Trying Resend API (recommended for cloud hosts)...');
    try {
      const resendResult = await sendEmailViaResend(to, subject, html);
      if (resendResult.success) {
        console.log('✅ Email sent successfully via Resend');
        return resendResult;
      }
      console.warn('⚠️ Resend failed:', resendResult.error);
      console.warn('📧 [2/2] Trying SMTP as fallback...');
    } catch (resendError) {
      console.error('❌ Resend exception:', resendError.message);
      console.warn('📧 [2/2] Trying SMTP as fallback...');
    }
  } else {
    console.warn('⚠️ Resend not configured. Set RESEND_API_KEY on the server (see backend/ENV_SETUP.md).');
  }

  if (transporter) {
    console.log(resendOk ? '📧 [2/2] Trying SMTP...' : '📧 Trying SMTP...');
    try {
      const smtpResult = await sendEmailViaSMTP(to, subject, html);
      if (smtpResult.success) {
        console.log('✅ Email sent successfully via SMTP');
        return smtpResult;
      }
      console.error('❌ SMTP failed:', smtpResult.error);
    } catch (smtpError) {
      console.error('❌ SMTP exception:', smtpError.message);
    }
  } else {
    console.warn('⚠️ SMTP transporter not available. Set SMTP_USER and SMTP_PASS (e.g. Gmail App Password).');
  }

  const errorMsg =
    'No email service succeeded. On Render: set RESEND_API_KEY (easiest) and FRONTEND_URL; optionally RESEND_FROM after you verify a domain. Or set SMTP_USER + SMTP_PASS if your host allows SMTP.';
  console.error('❌', errorMsg);
  console.error('❌ Email sending failed - check configuration above');
  return { success: false, error: errorMsg };
}

// Send will notification email
export async function sendWillNotificationEmail(recipientEmail, recipientName, willTitle, willType) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Will Finalized Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">Your Will Has Been Finalized</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Dear ${recipientName || 'Recipient'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is to inform you that a will has been finalized and you have been named as a beneficiary.
            </p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Will Title:</strong> ${willTitle}<br>
                <strong>Will Type:</strong> ${willType.charAt(0).toUpperCase() + willType.slice(1)} Will<br>
                <strong>Finalized:</strong> ${new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your will is now securely stored and encrypted. You will be notified when access conditions are met 
              and you can view the will details.
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 30px 0 0 0;">
              This is an automated notification from LegacyWallet.<br>
              Please do not reply to this email. If you have concerns, contact us through the platform.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via SMTP (or Resend as fallback)
    const emailResult = await sendEmail(
      recipientEmail,
      `Will Finalized: ${willTitle}`,
      emailHtml
    );

    if (emailResult.success) {
      console.log(`📧 Email notification sent to ${recipientEmail}`);
      return {
        success: true,
        message: 'Email notification sent',
        messageId: emailResult.messageId
      };
    } else {
      console.warn(`⚠️ Failed to send email to ${recipientEmail}: ${emailResult.error}`);
      return {
        success: false,
        error: emailResult.error || 'Failed to send email'
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function saveEmailNotification(willId, recipientEmail, recipientName, subject, status = 'pending', errorMessage = null) {
  try {
    const result = await pool.query(
      `INSERT INTO email_notifications (will_id, recipient_email, recipient_name, subject, status, sent_at, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, will_id, recipient_email, status, sent_at, created_at`,
      [
        willId,
        recipientEmail,
        recipientName || null,
        subject,
        status,
        status === 'sent' ? new Date() : null,
        errorMessage
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error saving email notification:', error);
    throw error;
  }
}

// Send asset creation notification to recipients
export async function sendAssetNotificationEmail(recipientEmail, recipientName, assetName, assetValue, assetDescription, creatorName) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Asset Added to Will</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">New Asset Added</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Dear ${recipientName || 'Recipient'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is to inform you that ${creatorName || 'the will creator'} has added a new asset to their will.
            </p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Asset Name:</strong> ${assetName}<br>
                ${assetValue ? `<strong>Estimated Value:</strong> $${parseFloat(assetValue).toLocaleString()}<br>` : ''}
                ${assetDescription ? `<strong>Description:</strong> ${assetDescription}<br>` : ''}
                <strong>Added:</strong> ${new Date().toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              This asset is now part of the will and will be distributed according to the will's instructions.
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 30px 0 0 0;">
              This is an automated notification from LegacyWallet.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResult = await sendEmail(
      recipientEmail,
      `New Asset Added: ${assetName}`,
      emailHtml
    );

    return emailResult;
  } catch (error) {
    console.error('Error sending asset notification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Send recipient added notification
export async function sendRecipientAddedEmail(recipientEmail, recipientName, creatorName) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've Been Added as a Beneficiary</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">You've Been Added as a Beneficiary</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Dear ${recipientName || 'Recipient'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is to inform you that ${creatorName || 'someone'} has added you as a beneficiary in their digital will.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You will receive notifications about any updates to the will, including new assets and finalization.
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 30px 0 0 0;">
              This is an automated notification from LegacyWallet.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResult = await sendEmail(
      recipientEmail,
      'You\'ve Been Added as a Beneficiary',
      emailHtml
    );

    return emailResult;
  } catch (error) {
    console.error('Error sending recipient added email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
