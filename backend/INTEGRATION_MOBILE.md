# Mobile Integration Guide

This guide explains how to integrate the mobile app (Android/iOS) with the backend API and enable push notifications.

## Prerequisites

1. **Backend Server Running**: Ensure the backend server is running on `http://localhost:3001` (or your configured URL)
2. **Firebase Project**: Set up Firebase project with Cloud Messaging enabled
3. **Environment Variables**: Configure backend and mobile app environment variables

## Backend Setup

### 1. Environment Variables

Add to `backend/.env`:

```env
DATABASE_URL=your_postgresql_connection_string
PORT=3001
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=re_your_resend_api_key  # For email notifications
EMAIL_FROM=LegacyWallet <noreply@legacywallet.com>
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start Backend Server

```bash
npm run dev
```

## Mobile App Setup

### 1. Install Dependencies

```bash
cd mobile_frontend
npm install expo-notifications expo-device
```

### 2. Environment Variables

Create `.env` file in `mobile_frontend/`:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Firebase Configuration

The Firebase configuration files are already in place:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

### 4. Push Notifications Setup

The app will automatically request push notification permissions on first launch. The token will be registered with the backend.

## API Endpoints

### Recipients

- **POST** `/api/recipients/add` - Add a new recipient
  ```json
  {
    "user_email": "user@example.com",
    "full_name": "John Doe",
    "email": "recipient@example.com",
    "phone": "+1234567890",
    "relationship": "spouse",
    "address": "123 Main St"
  }
  ```

- **GET** `/api/recipients/user-email/:userEmail` - Get all recipients for a user

### Assets

- **POST** `/api/assets/add` - Add a new asset (automatically sends email to recipients)
  ```json
  {
    "user_email": "user@example.com",
    "name": "House",
    "category": "property",
    "estimated_value": 500000,
    "description": "Family home",
    "currency": "USD"
  }
  ```

### Push Notifications

- **POST** `/api/push-notifications/register-token` - Register FCM token
  ```json
  {
    "user_email": "user@example.com",
    "fcm_token": "expo_push_token_here",
    "platform": "ios" // or "android"
  }
  ```

## Email Notifications

Email notifications are automatically sent when:
1. **Recipient Added**: When a recipient is added with an email address
2. **Asset Created**: When an asset is created, all recipients with email addresses are notified
3. **Will Finalized**: When a will is finalized, all recipients are notified

## Push Notifications

Push notifications can be sent via:
- **POST** `/api/push-notifications/send`
  ```json
  {
    "user_email": "user@example.com",
    "title": "New Asset Added",
    "body": "A new asset has been added to your will",
    "data": {
      "type": "asset_added",
      "asset_id": "123"
    }
  }
  ```

## Testing

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Mobile App**: `cd mobile_frontend && npm start`
3. **Test Recipient Addition**: Add a recipient with an email address
4. **Test Asset Creation**: Create an asset and verify recipients receive emails
5. **Test Push Notifications**: Register a token and send a test notification

## Troubleshooting

### Email Notifications Not Sending

1. Check `RESEND_API_KEY` is set in backend `.env`
2. Verify email addresses are valid
3. Check backend logs for errors

### Push Notifications Not Working

1. Ensure device is physical (not simulator/emulator)
2. Check notification permissions are granted
3. Verify FCM token is registered with backend
4. Check backend logs for errors

### Database Connection Issues

1. Verify `DATABASE_URL` in backend `.env`
2. Run `npm run init-db` to ensure tables exist
3. Check database connection: `GET /api/test-db`

## Next Steps

1. Set up Firebase Cloud Messaging in Firebase Console
2. Configure production email service (Resend/SendGrid)
3. Deploy backend to production
4. Update mobile app environment variables for production
