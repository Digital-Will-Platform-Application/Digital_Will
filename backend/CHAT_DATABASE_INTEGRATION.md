# Chat Database Integration & Cloudflare R2 Storage

This document describes the implementation of database storage for chat messages and Cloudflare R2 integration for audio/video files in chat context.

## Overview

The chat functionality now saves all messages to the backend PostgreSQL database and supports uploading audio/video files to Cloudflare R2 storage, with proper linking to chat messages.

## Database Schema

### New Table: `chat_messages`

```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    will_id INTEGER REFERENCES wills(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    audio_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Chat Messages

- **POST `/api/chat/message`** - Save a single chat message
  - Body: `{ user_email, role, content, will_id?, audio_url?, video_url? }`
  
- **POST `/api/chat/messages`** - Save multiple chat messages (batch)
  - Body: `{ user_email, messages: [{ role, content, audio_url?, video_url? }], will_id? }`
  
- **GET `/api/chat/messages`** - Get chat messages
  - Query params: `user_email` or `user_id`, optional `will_id`

### Chat File Uploads

- **POST `/api/chat/upload-audio`** - Upload audio file for chat message
  - Form data: `audio` (file), `user_email`, `will_id?`, `staging?`
  - Returns: `{ url, key, bucket, will_id }`
  
- **POST `/api/chat/upload-video`** - Upload video file for chat message
  - Form data: `video` (file), `user_email`, `will_id?`, `staging?`
  - Returns: `{ url, key, bucket, will_id }`

## Frontend Integration

### Web Frontend (`Legacy_wallet_Stage`)

- **File**: `src/pages/CreateChatWill.tsx`
- Messages are automatically saved to the database when:
  - User sends a message (saved immediately)
  - Assistant responds (saved after streaming completes)
  - User clicks "Save & Continue" (all messages saved in batch)

### Mobile Frontend (`mobile_frontend`)

- **File**: `app/(app)/create/chat.tsx`
- Same behavior as web frontend
- Messages saved to both backend database and Supabase (for compatibility)

## Database Connection

### Test Connection

Run the following command to test database connection:

```bash
npm run connection
```

This will verify that:
- `DATABASE_URL` is set in `.env`
- Database is accessible
- Connection pool is working

### Initialize Database

To create all tables including the new `chat_messages` table:

```bash
npm run init-db
```

## Environment Variables

Required environment variables (already configured):

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=staging
R2_STAGING_BUCKET=staging
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## How It Works

1. **User sends a message**:
   - Message is immediately saved to `chat_messages` table
   - Message is sent to AI chat API
   
2. **Assistant responds**:
   - Response is streamed to the frontend
   - After streaming completes, assistant message is saved to `chat_messages` table
   
3. **User saves conversation**:
   - All messages are saved in batch to `chat_messages` table
   - Will record is created/updated with transcript
   - Messages are linked to the will via `will_id`

4. **Audio/Video uploads**:
   - Files are uploaded to Cloudflare R2
   - URLs are returned and can be linked to chat messages via `audio_url` or `video_url` fields

## Error Handling

- Database save failures are logged but don't interrupt the chat flow
- If database is unavailable, chat continues to work (messages just won't be saved)
- R2 upload failures return proper error messages

## Migration

The new `chat_messages` table is automatically created when you run:

```bash
npm run init-db
```

Or manually run the migration:

```bash
psql $DATABASE_URL -f migrations/007_create_chat_messages_table.sql
```

## Testing

1. **Test database connection**:
   ```bash
   cd backend
   npm run connection
   ```

2. **Test chat message saving**:
   - Start chat in web or mobile app
   - Send a message
   - Check database: `SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10;`

3. **Test R2 upload**:
   - Use the chat upload endpoints
   - Verify files appear in Cloudflare R2 bucket
   - Check URLs are returned correctly
