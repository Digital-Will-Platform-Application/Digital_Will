import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load mobile_frontend/.env into process.env before reading EXPO_PUBLIC_* (EAS already sets env; override: false keeps EAS vars).
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

// Default API for EAS cloud builds when EXPO_PUBLIC_BACKEND_URL is missing (localhost breaks on real devices).
// For YOUR Neon-backed API: set EXPO_PUBLIC_BACKEND_URL in .env (local) and the same value in eas.json → env (APK cloud builds).
// Override via eas.json `env` or Expo dashboard environment variables.
// Fallback only when no mobile_frontend/.env on EAS. Must be the Node API origin (GET /health → JSON), not the static Vite site.
const DEFAULT_PUBLIC_BACKEND_URL = 'https://legacy-wallet-backend.onrender.com';

const resolvedBackendUrl = (() => {
  const raw = (process.env.EXPO_PUBLIC_BACKEND_URL || '').trim().replace(/\/+$/, '');
  if (raw) return raw;
  if (process.env.EAS_BUILD === 'true') return DEFAULT_PUBLIC_BACKEND_URL;
  return '';
})();

export default {
  expo: {
    name: 'Digital Will',
    slug: 'digital-will-application',
    version: '1.0.0',
    // Expo account slug (see https://expo.dev/accounts/<slug>), override with EXPO_ACCOUNT_OWNER if needed
    owner: process.env.EXPO_ACCOUNT_OWNER || 'iuindia',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'legacywallet',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: { image: './assets/images/splash-icon.png', resizeMode: 'contain', backgroundColor: '#FAF9F7' },
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: { foregroundImage: './assets/images/adaptive-icon.png', backgroundColor: '#FAF9F7' },
      edgeToEdgeEnabled: true,
      package: 'com.digitalwill.legacywallet'
    },
    web: { bundler: 'metro', output: 'static', favicon: './assets/images/favicon.png' },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#ffffff',
          sounds: [],
        },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      ...(resolvedBackendUrl ? { backendUrl: resolvedBackendUrl } : {}),
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      adminEmail: process.env.EXPO_PUBLIC_ADMIN_EMAIL,
      // EAS requires a projectId. Because this is a dynamic config (app.config.js),
      // `eas init` can't auto-write it — add it here manually (or override via env).
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '263e851c-3692-480e-8403-ea75a339c0e0',
      },
    },
  },
};
