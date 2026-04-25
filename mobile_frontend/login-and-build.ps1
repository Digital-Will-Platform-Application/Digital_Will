# EAS Login, init (first time), and Android APK build — Expo account: iuindia
# Run from mobile_frontend:  .\login-and-build.ps1

$ErrorActionPreference = "Stop"
$ExpectedExpoAccount = "iuindia"

Write-Host "EAS login + init + Android APK (account: $ExpectedExpoAccount)" -ForegroundColor Green
Write-Host "===============================================================`n" -ForegroundColor Green

Set-Location $PSScriptRoot

Write-Host "Step 0: Installing dependencies (npm install)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 1: Checking EAS login..." -ForegroundColor Cyan
$currentUser = npx eas-cli@latest whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Run: npx eas-cli@latest login" -ForegroundColor Yellow
    Write-Host "You can use browser login: npx eas-cli@latest login --web`n" -ForegroundColor Yellow
    npx eas-cli@latest login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Logged in as: $currentUser" -ForegroundColor Yellow
    if ("$currentUser".Trim() -ne $ExpectedExpoAccount) {
        Write-Host "Warning: expected Expo username '$ExpectedExpoAccount'. Build may fail if project is under the wrong account." -ForegroundColor Yellow
        Write-Host "To switch: npx eas-cli@latest logout   then   npx eas-cli@latest login`n" -ForegroundColor Yellow
    }
}

Write-Host "`nStep 2: Link EAS project (first time only)..." -ForegroundColor Cyan
Write-Host "If prompted to create a project for @$ExpectedExpoAccount/digital-will-application, choose Yes.`n" -ForegroundColor Yellow
npx eas-cli@latest init
if ($LASTEXITCODE -ne 0) {
    Write-Host "eas init had issues. If the project is already linked you can continue and try the build." -ForegroundColor Yellow
}

Write-Host "`nStep 3: Building Android APK (profile: preview)..." -ForegroundColor Cyan
Write-Host "This starts a cloud build (about 15+ minutes).`n" -ForegroundColor Yellow

npx eas-cli@latest build --platform android --profile preview

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild queued/started." -ForegroundColor Green
    Write-Host "Open: https://expo.dev/accounts/$ExpectedExpoAccount/projects/digital-will-application/builds`n" -ForegroundColor Cyan
} else {
    Write-Host "`nBuild command failed. Read the error above (common: wrong account, need eas init, or missing credentials)." -ForegroundColor Red
    exit 1
}
