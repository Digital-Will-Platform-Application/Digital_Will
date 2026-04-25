# Build Android APK - Quick Commands

## ✅ Setup Complete!

All configuration files are ready:
- ✅ EAS CLI installed
- ✅ eas.json configured
- ✅ app.config.js updated
- ✅ Logged in as: sivayya

## 🚀 Build Commands

### Option 1: Use Build Script (Easiest) ⭐

**PowerShell:**
```powershell
cd mobile_frontend
.\build-apk.ps1
```

**Command Prompt:**
```cmd
cd mobile_frontend
build-apk.bat
```

The script will:
- Check if you're logged in
- Configure EAS project (you'll type 'y' when prompted)
- Start the Android APK build

### Option 2: Manual Commands

```bash
# 1. Navigate to mobile frontend
cd mobile_frontend

# 2. Configure EAS project (first time only)
# When prompted, type 'y' to create the project
eas build:configure

# 3. Build Android APK
eas build --platform android --profile preview
```

## ⏱️ Build Process

1. **Upload** (5-10 minutes): Your code uploads to Expo servers
2. **Build** (10-20 minutes): APK builds in Expo cloud
3. **Download**: You'll get a download link when complete

## 📊 Monitor Build

- **Terminal**: See progress in real-time
- **Web Dashboard**: https://expo.dev/accounts/sivayya/projects/digital-will-application/builds
- **Project Page**: https://expo.dev/accounts/sivayya/projects/digital-will-application

## 📱 Install APK

Once build completes:
1. Download the APK file from the link provided
2. Transfer to Android device
3. Enable "Install from unknown sources" in Android settings
4. Install the APK

## 🔄 Alternative: Production Build

For Play Store release:
```bash
eas build --platform android --profile production
```

## 📖 Full Documentation

See: `BUILD_ANDROID_APK.md` for complete guide
