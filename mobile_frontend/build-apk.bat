@echo off
echo ========================================
echo   Android APK Build Script
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking EAS login...
eas whoami
if errorlevel 1 (
    echo ERROR: Not logged in. Please run: eas login
    pause
    exit /b 1
)
echo.

echo Step 2: Initializing EAS project...
echo IMPORTANT: When prompted, type 'y' and press Enter
echo.
eas init
if errorlevel 1 (
    echo.
    echo ERROR: Project initialization failed
    echo Make sure to type 'y' when prompted
    pause
    exit /b 1
)
echo.

echo Step 3: Building Android APK...
echo This will take 15-20 minutes...
echo.
eas build --platform android --profile preview

if errorlevel 1 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
) else (
    echo.
    echo SUCCESS: Build started!
    echo Monitor at: https://expo.dev/accounts/sivayya/projects/digital-will-application/builds
)

pause
