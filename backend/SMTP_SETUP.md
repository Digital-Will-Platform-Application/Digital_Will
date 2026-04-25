# SMTP Email Setup Guide

## Quick Setup for Gmail SMTP

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Select **Mail** and **Other (Custom name)**
7. Enter name: "LegacyWallet"
8. Click **Generate**
9. **Copy the 16-character password** (you'll need this)

### Step 2: Configure Backend

Add to `backend/.env`:

```env
# SMTP Configuration (Gmail)
SMTP_SERVICE=gmail
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Email From Address
EMAIL_FROM=LegacyWallet <your_email@gmail.com>

# Frontend URL (for verification links)
FRONTEND_URL=http://localhost:5173

# Optional: Resend API (fallback if SMTP fails)
RESEND_API_KEY=re_your_resend_api_key
```

**Important:** 
- Use your **Gmail address** for `SMTP_USER`
- Use the **16-character app password** (not your regular Gmail password) for `SMTP_PASS`
- The app password looks like: `abcd efgh ijkl mnop`

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

## Other SMTP Providers

### Outlook/Hotmail

```env
SMTP_SERVICE=outlook
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Custom SMTP Server

```env
SMTP_SERVICE=custom
SMTP_USER=your_email@yourdomain.com
SMTP_PASS=your_password
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
EMAIL_FROM=LegacyWallet <your_email@yourdomain.com>
```

## How It Works

1. **Primary**: Uses SMTP (nodemailer) if configured
2. **Fallback**: Uses Resend API if SMTP fails or not configured
3. **Error**: Returns error if neither is configured

## Testing

### Test Email Sending

```bash
curl -X POST http://localhost:3001/api/email-verification/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "test@example.com"
  }'
```

### Check Backend Logs

You should see:
```
✅ SMTP transporter configured
✅ Email sent successfully via SMTP: <message-id>
```

## Troubleshooting

### "SMTP not configured"
- Check `SMTP_USER` and `SMTP_PASS` are set in `.env`
- Restart backend after adding credentials

### "Invalid login credentials"
- For Gmail: Make sure you're using an **App Password**, not your regular password
- Enable 2-Step Verification first
- Check username is correct (full email address)

### "Connection timeout"
- Check your firewall allows SMTP connections
- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Try port 465 with `secure: true` if 587 doesn't work

### "Email not received"
- Check spam folder
- Verify email address is correct
- Check SMTP logs in backend console
- Try Resend API as fallback

## Security Notes

1. **Never commit `.env` to version control**
2. **Use App Passwords** for Gmail (not your main password)
3. **Rotate passwords** regularly
4. **Use environment variables** in production

## Production Setup

For production:
1. Use a dedicated email service (SendGrid, Mailgun, etc.)
2. Verify your domain with SPF/DKIM records
3. Use environment variables from your hosting provider
4. Monitor email delivery rates
