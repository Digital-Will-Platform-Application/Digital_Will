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
  // Always provide a usable backend URL on devices (empty/localhost breaks release APKs).
  // Prefer env when present; otherwise fall back to the hosted backend.
  return raw || DEFAULT_PUBLIC_BACKEND_URL;
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
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: 'Digital Will needs microphone access to record your audio will.',
        NSCameraUsageDescription: 'Digital Will needs camera access to record your video will.',
        NSPhotoLibraryAddUsageDescription: 'Digital Will saves your recordings to your device when needed.',
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/images/adaptive-icon.png', backgroundColor: '#FAF9F7' },
      edgeToEdgeEnabled: true,
      package: 'com.digitalwill.legacywallet',
      permissions: [
        'RECORD_AUDIO',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
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
      'expo-camera',
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
