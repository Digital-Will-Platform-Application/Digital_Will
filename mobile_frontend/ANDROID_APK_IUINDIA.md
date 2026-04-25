# Build Android APK (Expo account: `iuindia`)

Repo: [Digital_Will](https://github.com/Digital-Will-Platform-Application/Digital_Will)

## Prerequisite

- Node 18+ (LTS recommended)
- An Expo account with slug **`iuindia`**: [expo.dev/accounts/iuindia](https://expo.dev/accounts/iuindia)

## One-time setup (after clone)

From **`mobile_frontend/`**:

```powershell
cd mobile_frontend
npm install
npx eas-cli@latest login
```

Link this app to **your** EAS project (creates a new `projectId` under `iuindia`). Run **once**:

```powershell
npm run eas:init
```

Accept creating a project for `@iuindia/digital-will-application` when asked. This updates `app.config.js` with `extra.eas.projectId`.

Copy `.env.example` to `.env` and set **`EXPO_PUBLIC_BACKEND_URL`** (and any other **`EXPO_PUBLIC_*`**) to match your deployed **Node / Express API** (the service where `DATABASE_URL` and `JWT_SECRET` are set).

**Render:** If you have a **Static Site** (e.g. `digital-will-coc4.onrender.com` serving the Vite “Digital Will” UI), that URL is **not** the API. In the Render dashboard open your **Web Service** (Node backend), copy its **URL**, and set that as `EXPO_PUBLIC_BACKEND_URL`. Quick check: open `https://YOUR-API/health` in a browser — you should see JSON (`success`, `status`), not HTML.

**EAS cloud builds and `.env`:** Git still ignores `.env`, but **`mobile_frontend/.easignore`** ends with **`!.env`** so the same local file is **included in the EAS upload**. You normally do **not** need to duplicate values in `eas.json`.  
**Security:** In **`mobile_frontend/.env`** use only **`EXPO_PUBLIC_*`** (these are embedded in the client). Never put **`DATABASE_URL`**, **`JWT_SECRET`**, or other server secrets in the mobile folder — those belong only in **`backend/.env`**.

## Build APK (preview profile = APK in `eas.json`)

```powershell
npm run build:android:preview
```

Or production profile:

```powershell
npm run build:android:production
```

Monitor builds under: `https://expo.dev/accounts/iuindia/projects/digital-will-application/builds`

## Or use the helper script

From **`mobile_frontend/`**, double-click or run:

```powershell
.\login-and-build.ps1
```

## Common errors

- **`Failed to resolve plugin ... Do you have node modules installed?`**  
  Run `npm install` in `mobile_frontend`.

- **`Experience with id '...' does not exist`**  
  The `projectId` in `app.config.js` belonged to another Expo account or was deleted. Run `npm run eas:init` again while logged in as `iuindia`.

- **`Must configure EAS project by running eas init`**  
  You skipped `eas init`. Run `npm run eas:init` once, then build again.

- **APK installs but login shows “Invalid email or password” or generic errors**  
  - Your account must exist on the **same** database the **deployed** API uses (**Neon** `DATABASE_URL` on the server — see `backend/ENV_SETUP.md`). Register via **Create Account** on that API, or migrate users into that DB.  
  - The APK must use **`EXPO_PUBLIC_BACKEND_URL`** = that deployed API’s URL (`.env` for local dev; **`eas.json` `env`** for cloud APK). If the APK still points at a sample Render URL while your data lives on another server, login will always fail.  
  - If the server is misconfigured (`JWT_SECRET` too short, DB down), the app now surfaces the API’s error message where possible.

- **APK installs but login/API fails (network / cannot reach)**  
  Check the on-screen message for the API base URL hint. Fix **`EXPO_PUBLIC_BACKEND_URL`** in `.env` + **`eas.json`**, rebuild.

  Optional **Supabase** (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) is only for **active session / login_activity** UI; core auth uses the Express API + Neon.

- **App crashes on open**  
  Older builds could crash when Supabase env was empty (`supabaseUrl is required`). Pull the latest `mobile_frontend/lib/supabase.ts` fix and rebuild.
