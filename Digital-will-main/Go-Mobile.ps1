# From this Cursor workspace folder, jump to the real Expo app (one level up).
# Usage in PowerShell (note the leading dot + space — updates THIS window):
#   . .\Go-Mobile.ps1
# Then:
#   node .\scripts\eas-android-build.mjs preview
$here = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$mobile = Join-Path (Split-Path -Parent $here) 'mobile_frontend'
if (-not (Test-Path (Join-Path $mobile 'package.json'))) {
    Write-Error "Expo app not found at: $mobile"
    return
}
Set-Location -LiteralPath $mobile
Write-Host "cd -> $(Get-Location)"
