# Android APK Build Script - Manual Interactive Version
# Run this script in PowerShell to build your Android APK

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

Write-Host "Step 2: Initializing EAS project..." -ForegroundColor Cyan
Write-Host "⚠️  This will prompt you interactively." -ForegroundColor Yellow
Write-Host "When asked 'Would you like to create a project?', type 'y' and press Enter`n" -ForegroundColor Yellow

# Initialize project (interactive - user must type 'y')
eas init

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Project initialization failed or was cancelled" -ForegroundColor Red
    Write-Host "💡 Make sure to type 'y' when prompted to create the project`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Project initialized successfully!`n" -ForegroundColor Green

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
