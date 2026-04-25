# Digital Will (Legacy Wallet)

This repo contains:

- **Backend API**: `backend/` (Node + Express)
- **Web frontend**: `web_frontend/` (Vite + React)
- **Mobile app**: `mobile_frontend/` (Expo / React Native)

## Deploy to Render (Backend + Frontend)

This project is already configured for Render using `render.yaml` in the repo root.

### 1) Deploy using the Blueprint

1. In Render, go to **New +** → **Blueprint**
2. Select this GitHub repo
3. Render will create two services from `render.yaml`:
   - **Backend**: `legacy-wallet-backend` (Node web service)
   - **Frontend**: `legacy-wallet-frontend` (Static site)

### 2) Configure backend environment variables

In Render → **legacy-wallet-backend** → **Environment**, set at least:

- **`DATABASE_URL`**: use a Render Postgres instance (recommended) or your hosted Postgres URL
- **`JWT_SECRET`**: a strong random secret

Optional (if you use email / storage features):

- **SMTP**: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SERVICE`, `EMAIL_FROM`
- **Resend**: `RESEND_API_KEY`
- **Cloudflare R2**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, etc.
- **`FRONTEND_URL`**: set to your Render frontend URL (useful for links in emails)

The backend health check is `GET /health`.

For a complete list, see `backend/ENV_SETUP.md`.

### 3) Point the frontend to the backend

In Render → **legacy-wallet-frontend** → **Environment**, set:

- **`VITE_BACKEND_URL`** = your deployed backend URL, for example:
  - `https://<your-node-backend-service>.onrender.com` (use the **Web Service** URL, not the static frontend URL)

Then trigger a **Redeploy** of the frontend so the new build-time variable is included.

### Render build/start commands (from `render.yaml`)

- **Backend**
  - **Root directory**: `backend`
  - **Build**: `npm ci`
  - **Start**: `npm start`
- **Frontend**
  - **Root directory**: `web_frontend`
  - **Build**: `npm ci && npm run build`
  - **Publish directory**: `web_frontend/dist`

## Run locally (quick)

### Backend

```bash
cd backend
npm install
# create backend/.env (see backend/ENV_SETUP.md)
npm run dev
```

Backend runs on `http://localhost:3001`.

### Web frontend

```bash
cd web_frontend
npm install
# set VITE_BACKEND_URL in web_frontend/.env (do not commit)
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### Mobile app (Android APK via EAS)

See **`mobile_frontend/ANDROID_APK_IUINDIA.md`**. Short version:

```bash
cd mobile_frontend
npm install
npx eas-cli@latest login
npm run eas:init
npm run build:android:preview
```

For **EAS cloud APK** builds, put **`EXPO_PUBLIC_*`** in `mobile_frontend/.env` (gitignored). **`mobile_frontend/.easignore`** re-includes `.env` in the EAS upload so those values are used. If `.env` is missing at build time, `app.config.js` falls back to a default public API URL — set `.env` for your real backend.

## Security

- `.env` files are ignored by git. Do **not** commit secrets.

