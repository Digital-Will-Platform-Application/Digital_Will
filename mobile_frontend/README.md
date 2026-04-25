# Legacy Wallet — Mobile (Expo)

Native mobile app built with **Expo** and **React Native**, with **full feature parity** to the web app (Legacy_wallet-main). Same Supabase backend and auth.

## Features (aligned with web)

- **Auth**: Sign up, sign in, forgot/reset password
- **Public**: Home, How it works, Pricing, About, Contact, Learn more, Payment, Verify recipient
- **User (protected)**: Dashboard, Wills, Assets, Recipients, Account, Reminders
- **Create Will**: Audio, Video, Chat (draft creation; full recording/chat on web)
- **Will detail**, Review, Confirmation
- **Onboarding**: Asset selection for first-time users
- **Admin**: Redirect to admin panel (full admin UI on web)

## Setup

1. **Env**  
   Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_ADMIN_EMAIL` (optional, for admin redirect)

2. **Install & run**
   ```bash
   npm install
   npm start
   ```
   Or use **`npx expo start`** (do not use `npm expo start` — that is invalid).
   Then press **`w`** for web, or **scan the QR code** with Expo Go on your phone (Android/iOS).

3. **Run on your phone (easiest — no Android SDK needed)**
   - Run **`npm start`** (or `npx expo start`).
   - Install **Expo Go** on your phone (Play Store / App Store).
   - Scan the QR code shown in the terminal with Expo Go (Android) or Camera (iOS).
   - Phone and PC must be on the same Wi‑Fi.

4. **Android emulator / iOS simulator**
   - **Android:** `npm run android` requires Android Studio installed and **ANDROID_HOME** set (e.g. `C:\Users\YourName\AppData\Local\Android\Sdk`). Add `platform-tools` to PATH for `adb`. If you see "adb is not recognized" or "Failed to resolve the Android SDK path", install Android Studio and set ANDROID_HOME, or use Expo Go + QR instead.
   - **iOS:** `npm run ios` (macOS only).

## How to open in mobile view

- **On phone:** Run `npm start`, then scan the QR code with Expo Go (same Wi‑Fi). You’ll see the app in mobile layout on the device.
- **In browser (desktop):** Run `npm start`, press **`w`** to open web, then in Chrome/Edge press **F12** → click the **device toolbar** icon (or **Ctrl+Shift+M**) to toggle device mode and pick a phone (e.g. iPhone 12, Pixel 5) for a mobile-sized view.

## Project structure

- `app/` — Expo Router (file-based routes)
  - `index.tsx` — Home (redirects to dashboard if logged in)
  - `login`, `signup`, `forgot-password`, `reset-password`
  - `about`, `contact`, `how-it-works`, `pricing`, `learn-more`, `payment`, `verify-recipient`
  - `(app)/` — Protected user area
    - `(tabs)/` — Dashboard, Wills, Assets, Account
    - `onboarding`, `create`, `create/audio`, `create/video`, `create/chat`
    - `recipients`, `review`, `will/[id]`, `confirmation`, `reminders`
  - `admin/` — Admin entry (full admin on web)
- `lib/supabase.ts` — Supabase client (AsyncStorage for auth)
- `hooks/useAuth.tsx` — Auth context and hooks

## Backend

Uses the same Supabase project as the web app (`Legacy_wallet-main`). RLS and tables are shared.
