# Email Verification Fix Guide

## What Was Fixed

1. **Better Error Handling**: Added comprehensive error handling and logging
2. **Email Validation**: Added email format validation before sending
3. **Token Return**: Returns verification token even if email fails (for manual verification)
4. **Better Logging**: More detailed logs to help diagnose issues
5. **Test Script**: Added `npm run test-email` to test email configuration

## Required Environment Variables

Add these to your `backend/.env` file:

### Option 1: Gmail SMTP (Recommended for Development)

```env
# Gmail SMTP Configuration
SMTP_SERVICE=gmail
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=LegacyWallet <your_email@gmail.com>
FRONTEND_URL=http://localhost:5173
```

**Important for Gmail:**
- You MUST use an App Password, not your regular password
- See `GMAIL_SMTP_SETUP.md` for detailed instructions
- Enable 2-Step Verification first

### Option 2: Resend API (Easier Setup)

```env
# Resend API Configuration
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=LegacyWallet <onboarding@resend.dev>
FRONTEND_URL=http://localhost:5173
```

**Get Resend API Key:**
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add it to `.env`

### Option 3: Other SMTP Providers

```env
# Generic SMTP Configuration
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SERVICE=
EMAIL_FROM=LegacyWallet <your_email@example.com>
FRONTEND_URL=http://localhost:5173
```

## Testing Email Configuration

### 1. Test Email Service

```bash
cd backend
npm run test-email
```

This will:
- Check if SMTP or Resend is configured
- Send a test email to `TEST_EMAIL` (or `test@example.com` by default)
- Show detailed error messages if it fails

### 2. Test Verification Email Endpoint

```bash
curl -X POST http://localhost:3001/api/email-verification/send-verification \
  -H "Content-Type: application/json" \
  -d '{"user_email": "your_email@example.com"}'
```

### 3. Check Server Logs

When you send a verification email, check the backend console for:
- `📧 sendVerificationEmail called for userId: X, email: Y`
- `✅ Verification token created`
- `📧 Attempting to send verification email`
- `✅ Email sent successfully` or error messages

## Troubleshooting

### Error: "SMTP not configured"

**Solution:**
- Add `SMTP_USER` and `SMTP_PASS` to `.env`
- Or add `RESEND_API_KEY` to `.env`
- Restart the backend server

### Error: "Invalid login" or "535-5.7.8"

**Solution (Gmail):**
- You're using regular password instead of App Password
- Generate an App Password: Google Account → Security → App Passwords
- Use the 16-character App Password in `SMTP_PASS`

### Error: "Cannot connect to SMTP server"

**Solution:**
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- For Gmail: `smtp.gmail.com:587`
- Check firewall/network settings
- Try using Resend API instead

### Email Not Received

**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Check backend logs for errors
4. Run `npm run test-email` to verify configuration
5. Verify `FRONTEND_URL` is correct in `.env`

### Verification Link Doesn't Work

**Check:**
1. `FRONTEND_URL` in `.env` matches your frontend URL
2. Token hasn't expired (24 hours)
3. Frontend route `/verify-email` exists
4. Check backend logs for verification errors

## Quick Setup Checklist

- [ ] Add email configuration to `backend/.env`
- [ ] For Gmail: Generate App Password
- [ ] Set `FRONTEND_URL` to your frontend URL
- [ ] Run `npm run test-email` to verify
- [ ] Restart backend server
- [ ] Test sending verification email
- [ ] Check email inbox (and spam folder)

## Manual Verification (If Email Fails)

If email sending fails but token is created:
1. Check backend logs for the token
2. Use the token directly: `http://localhost:5173/verify-email?token=YOUR_TOKEN`
3. Or call the verify endpoint: `GET /api/email-verification/verify?token=YOUR_TOKEN`

## Support

If issues persist:
1. Check `backend/GMAIL_SMTP_SETUP.md` for Gmail setup
2. Check `backend/ENV_SETUP.md` for all environment variables
3. Review backend console logs for detailed error messages
4. Test with Resend API as alternative
