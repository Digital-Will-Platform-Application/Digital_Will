import express from 'express';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Test email sending endpoint
router.post('/test', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address (to) is required'
      });
    }

    const testHtml = html || `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email from LegacyWallet</h2>
          <p>This is a test email to verify SMTP configuration is working correctly.</p>
          <p>If you received this email, your SMTP setup is successful! ✅</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `;

    const result = await sendEmail(
      to,
      subject || 'Test Email - LegacyWallet',
      testHtml
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully!',
        data: {
          to,
          messageId: result.messageId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

export default router;
