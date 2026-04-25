# Enable Email Notifications with Resend

## Quick Setup

### Step 1: Get Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy your API key (starts with `re_`)

### Step 2: Configure Backend

Add to `backend/.env`:

```env
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=LegacyWallet <noreply@legacywallet.com>
```

**Important:** Replace `re_your_actual_api_key_here` with your actual Resend API key!

### Step 3: Verify Domain (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `legacywallet.com`)
3. Add the DNS records provided by Resend
4. Wait for verification (usually takes a few minutes)
5. Update `EMAIL_FROM` to use your verified domain:
   ```env
   EMAIL_FROM=LegacyWallet <noreply@yourdomain.com>
   ```

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

## When Emails Are Sent

Email notifications are automatically sent when:

1. **Will is Finalized** - Recipients receive notification
2. **Asset is Added** - All recipients are notified
3. **Recipient is Added** - New recipient receives welcome email

## Test Email Notifications

### Test via API:

```bash
curl -X POST http://localhost:3001/api/notifications/send-will-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "will_id": 1,
    "user_email": "user@example.com",
    "recipients": [
      {
        "email": "recipient@example.com",
        "name": "John Doe"
      }
    ]
  }'
```

### Test in Application:

1. Create a will
2. Add recipients with email addresses
3. Add assets (recipients will be notified)
4. Finalize the will (recipients will be notified)

## Email Templates

The system uses beautiful HTML email templates for:

- **Will Finalized**: Notifies recipients when a will is finalized
- **Asset Added**: Notifies recipients when new assets are added
- **Recipient Added**: Welcomes new recipients

## Troubleshooting

### "Email service not configured"
- Check `RESEND_API_KEY` is set in `.env`
- Restart backend after adding the key

### "Failed to send email"
- Verify API key is correct
- Check Resend dashboard for error logs
- Ensure domain is verified (if using custom domain)

### Emails going to spam
- Verify your domain in Resend
- Use a verified sender email
- Add SPF/DKIM records (Resend provides these)

## Free Tier Limits

Resend free tier includes:
- 3,000 emails/month
- 100 emails/day
- Perfect for development and testing

## Production Setup

For production:
1. Upgrade Resend plan if needed
2. Verify your domain
3. Set up SPF/DKIM records
4. Monitor email delivery in Resend dashboard
