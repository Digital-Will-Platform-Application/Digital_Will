# Gmail SMTP Setup Guide

## Why Gmail App Password is Required

Gmail no longer allows regular passwords for SMTP. You **must** use an **App Password** for authentication.

## Step-by-Step Setup

### 1. Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable it (you'll need your phone)

### 2. Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: **LegacyWallet Backend**
6. Click **Generate**
7. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### 3. Update backend/.env

Add or update these lines in `backend/.env`:

```env
# SMTP Configuration (Gmail)
SMTP_SERVICE=gmail
SMTP_USER=your_email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=LegacyWallet <your_email@gmail.com>
```

**Important:**
- Use your **full Gmail address** for `SMTP_USER`
- Use the **16-character App Password** (with or without spaces) for `SMTP_PASS`
- Do NOT use your regular Gmail password

### 4. Restart Backend

After updating `.env`, restart the backend:

```bash
cd backend
npm run dev
```

### 5. Verify Connection

You should see in the backend logs:
```
✅ SMTP transporter configured and verified
```

If you see an error, check:
- App Password is correct (no extra spaces)
- 2-Step Verification is enabled
- Email address is correct

## Troubleshooting

### Error: "Invalid login: 535-5.7.8"

**Solution:** 
- Make sure you're using an **App Password**, not your regular password
- Verify 2-Step Verification is enabled
- Regenerate the App Password if needed

### Error: "Less secure app access"

**Solution:**
- Google deprecated "Less secure app access"
- You **must** use App Passwords instead
- Enable 2-Step Verification first

### Still Not Working?

1. Double-check your `.env` file has correct values
2. Make sure there are no extra spaces in the App Password
3. Try regenerating the App Password
4. Restart the backend server

## Alternative: Use Resend API

If Gmail SMTP continues to have issues, you can use Resend API instead:

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `backend/.env`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=LegacyWallet <onboarding@resend.dev>
   ```
4. The system will automatically use Resend if SMTP fails

## Security Notes

- **Never commit `.env` to git**
- App Passwords are safer than regular passwords
- Each App Password can be revoked individually
- You can create multiple App Passwords for different apps
