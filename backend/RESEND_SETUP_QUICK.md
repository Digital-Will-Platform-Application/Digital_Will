# Resend API Quick Setup

## ✅ Configuration Updated

Your `.env` file has been updated with:
- `EMAIL_FROM=LegacyWallet <onboarding@resend.dev>`
- `FRONTEND_URL=http://localhost:5173`
- `RESEND_API_KEY=re_your_api_key_here` (placeholder - needs your actual key)

## 🔑 Get Your Resend API Key

1. **Sign up at [resend.com](https://resend.com)** (free tier available)
2. **Go to API Keys** in the dashboard
3. **Create a new API key**
4. **Copy the key** (starts with `re_`)
5. **Update `.env` file:**
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

## 🧪 Test Email Configuration

After adding your Resend API key:

```bash
cd backend
npm run test-email
```

This will send a test email to verify everything works.

## 📧 How It Works

The email system will:
1. **Try SMTP first** (if configured)
2. **Fallback to Resend** if SMTP fails or isn't configured
3. **Use Resend** if `RESEND_API_KEY` is set

Since you're using Resend, you can:
- Keep SMTP config (as backup)
- Or remove SMTP config to use only Resend

## 🚀 Next Steps

1. Get your Resend API key from resend.com
2. Replace `re_your_api_key_here` in `.env` with your actual key
3. Restart backend server (if running)
4. Test with: `npm run test-email`
5. Try sending a verification email

## ✅ Current Configuration

```
RESEND_API_KEY=re_your_api_key_here  ← Replace with your actual key
EMAIL_FROM=LegacyWallet <onboarding@resend.dev>
FRONTEND_URL=http://localhost:5173
```

**Note:** `onboarding@resend.dev` is Resend's default sender domain. You can use your own domain later by verifying it in Resend dashboard.
