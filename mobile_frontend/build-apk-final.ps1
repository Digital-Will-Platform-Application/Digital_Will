# Final APK Build Script - Run this after projectId is configured
# The projectId has been added to app.config.js

Write-Host "🚀 Building Android APK" -ForegroundColor Green
Write-Host "=======================`n" -ForegroundColor Green

Set-Location $PSScriptRoot

Write-Host "✅ ProjectId configured: 229b98ac-a86c-4167-be35-02164b556cda" -ForegroundColor Green
Write-Host "✅ Owner: kreddyking`n" -ForegroundColor Green

Write-Host "Step 1: Verifying project configuration..." -ForegroundColor Cyan
eas project:info
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Project not configured properly" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project configured`n" -ForegroundColor Green

Write-Host "Step 2: Setting up Android credentials (if needed)..." -ForegroundColor Cyan
Write-Host "⚠️  If this is your first build, you'll be prompted to generate a keystore." -ForegroundColor Yellow
Write-Host "   Just follow the prompts - Expo will manage it for you.`n" -ForegroundColor Yellow

# Try to setup credentials (may prompt interactively)
eas credentials --platform android

Write-Host "`nStep 3: Building Android APK (Preview)..." -ForegroundColor Cyan
Write-Host "⏳ This will take 15-20 minutes`n" -ForegroundColor Yellow
Write-Host "💡 If prompted about keystore, choose 'Generate new keystore'`n" -ForegroundColor Yellow

# Build without --non-interactive to allow keystore generation
eas build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build started successfully!" -ForegroundColor Green
    Write-Host "📊 Monitor your build at:" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/kreddyking/projects/digital-will-application/builds`n" -ForegroundColor White
    Write-Host "💡 You'll receive a download link when the build completes (15-20 minutes).`n" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Build failed. Check the error messages above." -ForegroundColor Red
    Write-Host "`nCommon fixes:" -ForegroundColor Yellow
    Write-Host "  - If keystore error: Run 'eas credentials --platform android' first" -ForegroundColor White
    Write-Host "  - Make sure you're logged in: eas whoami" -ForegroundColor White
    exit 1
}
