# Android APK Build Script
# This script will build the Android APK using Expo EAS

Write-Host "🚀 Android APK Build Script" -ForegroundColor Green
Write-Host "==========================`n" -ForegroundColor Green

# Navigate to mobile_frontend directory
Set-Location $PSScriptRoot

Write-Host "Step 1: Checking EAS login..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in as: $whoami`n" -ForegroundColor Green

Write-Host "Step 2: Configuring EAS project..." -ForegroundColor Cyan
Write-Host "When prompted, type 'y' and press Enter`n" -ForegroundColor Yellow

# Configure project (interactive)
eas build:configure

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Project configuration failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Project configured successfully!`n" -ForegroundColor Green

Write-Host "Step 3: Building Android APK..." -ForegroundColor Cyan
Write-Host "⏳ This will take 15-20 minutes. Building in Expo cloud...`n" -ForegroundColor Yellow

# Build APK
eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build started successfully!" -ForegroundColor Green
    Write-Host "📊 Monitor your build at:" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/sivayya/projects/digital-will-application/builds`n" -ForegroundColor White
    Write-Host "💡 You'll receive a download link when the build completes.`n" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Build failed. Check the error messages above." -ForegroundColor Red
    exit 1
}
