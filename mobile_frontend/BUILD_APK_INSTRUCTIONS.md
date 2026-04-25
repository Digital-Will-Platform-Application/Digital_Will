# Build Android APK - Step by Step Instructions

## Quick Fix for "EAS project not configured" Error

The EAS CLI requires **interactive input** to configure your project. Follow these steps:

## Method 1: Using PowerShell Script (Recommended)

1. **Open PowerShell** in the `mobile_frontend` directory
2. **Run the build script:**
   ```powershell
   .\build-apk-manual.ps1
   ```
3. **When prompted** "Would you like to create a project?", type `y` and press Enter
4. **Wait for the build** to complete (15-20 minutes)

## Method 2: Manual Commands

Run these commands **one at a time** in your terminal:

### Step 1: Navigate to mobile_frontend
```powershell
cd mobile_frontend
```

### Step 2: Verify you're logged in
```powershell
eas whoami
```
Should show: `sivayya`

### Step 3: Initialize EAS Project (Interactive)
```powershell
eas init
```
**Important:** When prompted "Would you like to create a project for @sivayya/digital-will-application?", type `y` and press Enter.

This will:
- Create the EAS project
- Add the projectId to your app.config.js automatically
- Configure the project for builds

### Step 4: Build the Android APK
```powershell
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud (15-20 minutes)
- Provide a download link when complete

## Monitor Your Build

While the build is running, you can monitor progress at:
- **Build Dashboard:** https://expo.dev/accounts/sivayya/projects/digital-will-application/builds
- **Terminal:** Progress updates will appear in your terminal

## Download the APK

Once the build completes:
1. You'll see a download link in the terminal
2. Or visit the build dashboard link above
3. Download the `.apk` file
4. Transfer to your Android device
5. Enable "Install from unknown sources" in Android settings
6. Install the APK

## Troubleshooting

### "EAS project not configured"
- Run `eas init` first (Step 3 above)
- Make sure to type `y` when prompted

### "Not logged in"
- Run `eas login`
- Enter your Expo credentials

### "Build failed"
- Check build logs at the dashboard link
- Common issues:
  - Missing environment variables
  - Invalid app configuration
  - Network issues

## Alternative: Production Build

For Play Store release:
```powershell
eas build --platform android --profile production
```

## Notes

- **First build** requires project initialization (one-time setup)
- **Subsequent builds** can use: `eas build --platform android --profile preview`
- Builds run in Expo cloud (no local Android SDK needed)
- APK files are typically 20-50 MB
