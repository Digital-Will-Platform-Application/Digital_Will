# Email Notifications Setup Guide

This guide explains how to set up email notifications for recipients when a will is finalized.

## Overview

When a will is finalized (status changed to "completed"), the system automatically sends email notifications to all recipients who have email addresses in the database.

## Email Service Configuration

The system uses **Resend** for sending emails. You can also use other email services like SendGrid, Mailgun, or AWS SES by modifying the `notify-recipients` edge function.

### Setting up Resend

1. **Create a Resend account**
   - Go to [resend.com](https://resend.com) and sign up
   - Verify your email address

2. **Get your API key**
   - Navigate to API Keys in your Resend dashboard
   - Create a new API key
   - Copy the API key (starts with `re_`)

3. **Verify your domain** (Recommended for production)
   - Add your domain in Resend dashboard
   - Add the required DNS records
   - Wait for verification

4. **Set environment variables**
   - In your Supabase project, go to Settings > Edge Functions > Secrets
   - Add the following secrets:
     - `RESEND_API_KEY`: Your Resend API key
     - `APP_URL`: Your application URL (e.g., `https://legacywallet.com`)

### Alternative: Using Supabase Email (Development)

If you don't want to set up Resend for development, you can modify the edge function to use Supabase's built-in email service or another provider. The function will gracefully handle missing email configuration.

## Edge Function Deployment

1. **Deploy the edge function**
   ```bash
   supabase functions deploy notify-recipients
   ```

2. **Set environment variables**
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   supabase secrets set APP_URL=https://your-app-url.com
   ```

## How It Works

1. When a user finalizes their will in `ReviewWill.tsx`, the will status is updated to "completed"
2. The system calls the `notify-recipients` edge function
3. The function:
   - Fetches the will details
   - Retrieves all recipients with email addresses
   - Sends personalized email notifications to each recipient
   - Returns a summary of sent/failed emails

## Email Template

The email includes:
- Personalized greeting with recipient's name
- Will creator's name
- Will title and type
- Finalization date
- Link to the dashboard
- Professional styling matching the app's design

## Testing

To test email notifications:

1. Create a test will
2. Add recipients with email addresses
3. Finalize the will
4. Check recipient email inboxes for notifications

## Troubleshooting

### Emails not sending

1. **Check Resend API key**
   - Verify the API key is set correctly in Supabase secrets
   - Ensure the API key has proper permissions

2. **Check function logs**
   - Go to Supabase Dashboard > Edge Functions > notify-recipients > Logs
   - Look for error messages

3. **Verify recipients have emails**
   - Ensure recipients in the database have valid email addresses
   - Check that emails are not null

4. **Domain verification**
   - For production, ensure your sending domain is verified in Resend
   - Update the `from` field in the edge function to use your verified domain

### Common Issues

- **"RESEND_API_KEY is not configured"**: Set the secret in Supabase
- **"Failed to send email"**: Check Resend dashboard for delivery issues
- **Emails going to spam**: Verify your domain and set up SPF/DKIM records

## Customization

You can customize the email template by editing `supabase/functions/notify-recipients/index.ts`:

- Modify the HTML template
- Add more will details
- Include asset information
- Add recipient-specific allocations

## Security Notes

- The edge function uses Supabase service role key for database access
- Only recipients associated with the will creator receive emails
- Email addresses are validated before sending
- Failed email sends don't block will finalization
