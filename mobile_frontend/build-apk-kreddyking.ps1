# Android APK Build Script for kreddyking account
# Run this in PowerShell

Write-Host "🚀 Building Android APK for kreddyking account" -ForegroundColor Green
Write-Host "==============================================`n" -ForegroundColor Green

Set-Location $PSScriptRoot

Write-Host "Step 1: Checking login status..." -ForegroundColor Cyan
$currentUser = eas whoami 2>&1
if ($LASTEXITCODE -ne 0 -or $currentUser -notmatch "kreddyking") {
    Write-Host "⚠️  Not logged in as kreddyking" -ForegroundColor Yellow
    Write-Host "Please run: eas login" -ForegroundColor Yellow
    Write-Host "Then enter your kreddyking credentials`n" -ForegroundColor Yellow
    Write-Host "After logging in, run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Logged in as: $currentUser`n" -ForegroundColor Green

Write-Host "Step 2: Initializing EAS project..." -ForegroundColor Cyan
Write-Host "When prompted 'Would you like to create a project?', type 'y' and press Enter`n" -ForegroundColor Yellow

eas init

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Project initialization may have failed or was skipped" -ForegroundColor Yellow
    Write-Host "Continuing with build...`n" -ForegroundColor Yellow
}

Write-Host "`nStep 3: Building Android APK (Preview)..." -ForegroundColor Cyan
Write-Host "⏳ This will take 15-20 minutes`n" -ForegroundColor Yellow

eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build started successfully!" -ForegroundColor Green
    Write-Host "📊 Monitor at: https://expo.dev/accounts/kreddyking/projects/digital-will-application/builds`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed. Check errors above." -ForegroundColor Red
    exit 1
}
