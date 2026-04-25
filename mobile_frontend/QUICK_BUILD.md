> **Superseded:** use **`ANDROID_APK_IUINDIA.md`** and Expo account **`iuindia`**. The steps below are for the old `kreddyking` setup only.

# Quick APK Build Guide - kreddyking Account

## Fast Setup (3 Steps)

### Step 1: Login to EAS
Open PowerShell in `mobile_frontend` folder and run:
```powershell
eas login
```
Enter your **kreddyking** credentials when prompted.

### Step 2: Initialize Project (First Time Only)
```powershell
eas init
```
When asked: **"Would you like to create a project for @kreddyking/digital-will-application?"**
Type: **`y`** and press Enter

### Step 3: Build APK
```powershell
eas build --platform android --profile preview
```

## Or Use the Script

Double-click: **`build-apk-kreddyking.ps1`**

## Monitor Build

Watch progress at:
**https://expo.dev/accounts/kreddyking/projects/digital-will-application/builds**

## Download APK

When build completes:
1. Click the download link in terminal
2. Or visit the build dashboard above
3. Download the `.apk` file
4. Install on Android device

## Troubleshooting

**"Not logged in"**
- Run `eas login` first
- Make sure you use **kreddyking** account

**"EAS project not configured"**
- Run `eas init` first
- Type `y` when prompted

**"Build failed"**
- Check build logs at dashboard
- Verify app.config.js has correct owner: `kreddyking`
