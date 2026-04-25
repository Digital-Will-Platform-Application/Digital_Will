import dotenv from 'dotenv';
import { sendEmail } from '../services/emailService.js';

dotenv.config();

async function testEmail() {
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  console.log('📧 Testing email configuration...');
  console.log(`📧 SMTP_USER: ${process.env.SMTP_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`📧 SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`📧 RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`📧 EMAIL_FROM: ${process.env.EMAIL_FROM || 'Using default'}`);
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('');

  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Test Email from LegacyWallet Backend</h1>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `;

  try {
    const result = await sendEmail(
      testEmail,
      'Test Email - LegacyWallet Backend',
      testHtml
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId || 'N/A'}`);
      console.log(`📧 Check your inbox at: ${testEmail}`);
    } else {
      console.error('❌ Failed to send test email');
      console.error(`❌ Error: ${result.error}`);
      console.error('');
      console.error('💡 Troubleshooting:');
      console.error('   1. Check SMTP_USER and SMTP_PASS in .env');
      console.error('   2. For Gmail, use an App Password (see GMAIL_SMTP_SETUP.md)');
      console.error('   3. Or set RESEND_API_KEY for Resend API');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Exception while sending test email:', error);
    process.exit(1);
  }
}

testEmail();
