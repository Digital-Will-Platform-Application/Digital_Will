# Cloudflare R2 Storage Setup Guide

This guide explains how to set up Cloudflare R2 buckets for storing voice and video recordings.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **R2 Access**: R2 is available in Cloudflare dashboard

## Step 1: Create R2 Buckets

### Production Bucket

1. Go to Cloudflare Dashboard > R2
2. Click **"Create bucket"**
3. Name: `legacy-wallet-recordings`
4. Click **"Create bucket"**

### Staging Bucket

1. Create another bucket
2. Name: `legacy-wallet-recordings-staging`
3. Click **"Create bucket"**

## Step 2: Enable Public Access

### For Production Bucket

1. Go to your bucket: `legacy-wallet-recordings`
2. Click **"Settings"** tab
3. Scroll to **"Public Access"**
4. Enable **"Allow Access"**
5. Note the **Public URL** (format: `https://pub-{account-id}.r2.dev`)

### For Staging Bucket

1. Repeat the same steps for `legacy-wallet-recordings-staging`
2. Enable public access
3. Note the public URL (same base URL, different bucket name)

## Step 3: Create API Token

1. Go to Cloudflare Dashboard > R2 > **"Manage R2 API Tokens"**
2. Click **"Create API token"**
3. Set permissions:
   - **Object Read & Write** (for both buckets)
4. Click **"Create API Token"**
5. **Save the credentials**:
   - Access Key ID
   - Secret Access Key
   - Account ID

## Step 4: Configure Backend

Add to `backend/.env`:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=legacy-wallet-recordings
R2_STAGING_BUCKET=legacy-wallet-recordings-staging
R2_PUBLIC_URL=https://pub-{your_account_id}.r2.dev

# Environment
NODE_ENV=development  # Use staging bucket in development
```

## Step 5: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `@aws-sdk/client-s3` - S3-compatible SDK for R2
- `@aws-sdk/s3-request-presigner` - For signed URLs
- `multer` - For handling file uploads

## Step 6: Test Configuration

```bash
# Check if R2 is configured
curl http://localhost:3001/api/upload/status
```

Expected response:
```json
{
  "success": true,
  "r2Configured": true,
  "message": "R2 storage is configured and ready"
}
```

## Step 7: Test Upload

### Upload Audio

```bash
curl -X POST http://localhost:3001/api/upload/audio \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@/path/to/audio.webm" \
  -F "user_email=user@example.com" \
  -F "staging=true"
```

### Upload Video

```bash
curl -X POST http://localhost:3001/api/upload/video \
  -H "Content-Type: multipart/form-data" \
  -F "video=@/path/to/video.webm" \
  -F "user_email=user@example.com" \
  -F "staging=true"
```

## Bucket Structure

Files are organized as:
```
legacy-wallet-recordings/
├── audio/
│   └── {user_id}/
│       └── audio-will-{timestamp}.webm
└── video/
    └── {user_id}/
        └── video-will-{timestamp}.webm
```

## Public URLs

Files are accessible via public URLs:
- Production: `https://pub-{account-id}.r2.dev/legacy-wallet-recordings/audio/{user_id}/audio-will-{timestamp}.webm`
- Staging: `https://pub-{account-id}.r2.dev/legacy-wallet-recordings-staging/audio/{user_id}/audio-will-{timestamp}.webm`

## Environment-Based Bucket Selection

- **Development** (`NODE_ENV=development`): Uses staging bucket
- **Production** (`NODE_ENV=production`): Uses production bucket
- **Manual override**: Pass `staging=true` in request body

## Troubleshooting

### "R2 storage is not configured"
- Check that all R2 environment variables are set in `.env`
- Restart the backend server after adding variables

### "Access Denied" or "403 Forbidden"
- Verify API token has correct permissions
- Check bucket public access is enabled
- Verify bucket names match in `.env`

### "Bucket not found"
- Ensure buckets are created in Cloudflare dashboard
- Check bucket names in `.env` match exactly

### Upload fails
- Check file size (max 500MB)
- Verify file format (audio/webm, video/webm)
- Check backend logs for detailed error messages

## Security Notes

1. **Public Access**: Files are publicly accessible via URLs. Consider:
   - Using signed URLs for sensitive content
   - Implementing access control in your application
   - Using R2's custom domain with authentication

2. **API Tokens**: Keep tokens secure:
   - Never commit `.env` to version control
   - Rotate tokens regularly
   - Use least privilege principle

3. **File Validation**: The backend validates:
   - File size (max 500MB)
   - Content type
   - User authentication

## Next Steps

1. Update frontend to use R2 upload endpoints
2. Implement progress tracking for large files
3. Add file deletion endpoints
4. Set up CDN for faster delivery (optional)
