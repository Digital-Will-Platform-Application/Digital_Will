# Backend Integration Guide

## Overview

The backend API is now integrated to store all will creation data in NeonDB. The flow is:

1. **Login** → User authenticates
2. **Create Chat Will** → Conversation saved to `wills` table
3. **Add Assets** → Assets saved to `assets` table
4. **Review & Finalize** → Will status updated to "completed" and email notifications sent

## Database Tables

### 1. `users` - User accounts
- Stores user registration information
- Fields: username, email, mobile, password (hashed), address, age, gender, state, postal_code

### 2. `wills` - Will documents
- Stores chat conversations and will content
- Fields: user_id, title, type, status, content, transcript, audio_url, video_url, notes

### 3. `assets` - User assets
- Stores assets with name, estimated value, and description
- Fields: user_id, name, category, estimated_value, description, currency

### 4. `email_notifications` - Email tracking
- Tracks email notifications sent to recipients
- Fields: will_id, recipient_email, recipient_name, subject, status, sent_at

## API Endpoints

### Wills
- `POST /api/wills/save` - Save or update will (chat conversation)
- `GET /api/wills/user/:userId` - Get user's will
- `POST /api/wills/finalize` - Finalize will (set status to "completed")

### Assets
- `POST /api/assets/add` - Add new asset
- `GET /api/assets/user/:userId` - Get all user's assets
- `GET /api/assets/:id` - Get asset by ID
- `DELETE /api/assets/:id` - Delete asset

### Notifications
- `POST /api/notifications/send-will-notifications` - Send email notifications for finalized will
- `GET /api/notifications/will/:willId` - Get email notifications for a will

## Frontend Integration

The frontend has been updated to use the backend API:

1. **CreateChatWill.tsx** - Uses `backendApi.saveWill()` to save chat conversations
2. **AssetManagement.tsx** - Uses `backendApi.addAsset()` to add assets
3. **ReviewWill.tsx** - Uses `backendApi.finalizeWill()` and `backendApi.sendWillNotifications()` to finalize and notify

## Important Notes

### User ID Mapping
The frontend currently uses `user.id` from Supabase auth. You may need to:
- Map Supabase user IDs to backend user IDs, OR
- Use the backend user ID from the login response

### Email Service
The email service (`backend/services/emailService.js`) currently logs emails but doesn't send them. To enable actual email sending:
1. Set up Resend, SendGrid, or similar service
2. Update `sendWillNotificationEmail()` function
3. Add API keys to `.env` file

## Testing

1. **Test Will Creation:**
   ```bash
   curl -X POST http://localhost:3001/api/wills/save \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "transcript": "User: Hello\nAssistant: Hi, how can I help?",
       "title": "My Chat-Based Will",
       "type": "chat"
     }'
   ```

2. **Test Asset Addition:**
   ```bash
   curl -X POST http://localhost:3001/api/assets/add \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "name": "Family House",
       "category": "property",
       "estimated_value": "500000",
       "description": "Family home in downtown"
     }'
   ```

3. **Test Will Finalization:**
   ```bash
   curl -X POST http://localhost:3001/api/wills/finalize \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "will_id": 1
     }'
   ```

## Environment Variables

Add to `backend/.env`:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-secret-key
PORT=3001
RESEND_API_KEY=your_resend_api_key (optional, for email sending)
```

## Next Steps

1. ✅ Database tables created
2. ✅ Backend API endpoints created
3. ✅ Frontend updated to use backend API
4. ⏳ Set up email service (Resend/SendGrid)
5. ⏳ Map Supabase user IDs to backend user IDs (if needed)
6. ⏳ Add authentication middleware (JWT verification)
