# Environment Variables Setup

This guide lists all required and optional environment variables for the backend.

## Required Environment Variables

### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/legacy_wallet
```

### JWT Authentication
```env
JWT_SECRET=your-secret-key-change-this-in-production
```
**Important**: Generate a strong, random secret key for production. You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Server
```env
PORT=3001
NODE_ENV=development
```

## Optional Environment Variables

### Email Configuration (SMTP)
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SERVICE=gmail
EMAIL_FROM=LegacyWallet <noreply@legacywallet.com>
```

### Email Configuration (Resend — recommended on Render)

Resend uses HTTPS and usually works when SMTP ports are blocked.

```env
RESEND_API_KEY=re_xxxxxxxx   # from https://resend.com — required on the server (e.g. Render → backend env)
# Optional: after you verify your own domain in Resend, set a matching sender:
# RESEND_FROM=LegacyWallet <noreply@yourverifieddomain.com>
```

If you omit `RESEND_FROM`, the API uses **`LegacyWallet <onboarding@resend.dev>`**, which Resend allows for testing without a custom domain. Production should use a verified domain and set `RESEND_FROM`.

### Frontend URL (for email verification links)

The verification button in emails points to `FRONTEND_URL/verify-email?token=...`. **Set this to your live site** in production (e.g. your Render static frontend URL).

```env
FRONTEND_URL=https://your-frontend.onrender.com
```

### Cloudflare R2 Storage Configuration
```env
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=staging
R2_STAGING_BUCKET=staging
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## Setup Instructions

1. **Create `.env` file** in the `backend` directory:
   ```bash
   cd backend
   touch .env
   ```

2. **Add the required variables** to `.env`:
   ```env
   DATABASE_URL=your_database_url
   JWT_SECRET=your-secret-key
   PORT=3001
   NODE_ENV=development
   ```

3. **Generate a secure JWT_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and use it as your `JWT_SECRET` value.

4. **Add optional variables** as needed for your setup (email, R2 storage, etc.)

## Mobile app (Expo) and Neon

The **mobile app never connects to Neon directly**. It only calls your **Express API** (`EXPO_PUBLIC_BACKEND_URL` in `mobile_frontend/.env` and in `mobile_frontend/eas.json` for APK builds).

1. Set **`DATABASE_URL`** in **`backend/.env`** (or your host’s environment) to your **Neon** Postgres connection string.
2. Set **`JWT_SECRET`** (at least 16 characters) on the same server.
3. Deploy or run the backend so it is reachable at a public `https://...` URL (or use local + tunnel for development).
4. In **`mobile_frontend`**, set **`EXPO_PUBLIC_BACKEND_URL`** in **`.env`** to that API URL. **EAS cloud builds** pick up that gitignored file because **`mobile_frontend/.easignore`** ends with **`!.env`** (see [EAS ignore docs](https://docs.expo.dev/build-reference/easignore/)). Optionally set variables in **`eas.json`** or the Expo dashboard if you prefer not to upload `.env`.
5. **Users/passwords** live in the **`users`** table in the database attached to **that** API. Register through the app or API against the same deployment you configured in step 3.

See also **`mobile_frontend/ANDROID_APK_IUINDIA.md`**.

## Security Notes

- **Never commit `.env` to version control** (it's already in `.gitignore`)
- Use strong, random values for `JWT_SECRET` in production
- Rotate `JWT_SECRET` periodically in production
- Use different `JWT_SECRET` values for development and production

## Verification

After setting up your `.env` file, verify the configuration:

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Check health endpoint**:
   ```bash
   curl http://localhost:3001/health
   ```

3. **Test database connection**:
   ```bash
   curl http://localhost:3001/api/test-db
   ```

4. **Test authentication** (should work with JWT_SECRET):
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@example.com","password":"test123","confirm_password":"test123"}'
   ```
