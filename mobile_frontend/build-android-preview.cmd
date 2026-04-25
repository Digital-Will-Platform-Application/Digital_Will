@echo off
REM Does not use npm.cmd / npm.ps1 (fixes "Could not determine Node.js install directory" in PowerShell).
cd /d "%~dp0"
node scripts\eas-android-build.mjs preview
exit /b %ERRORLEVEL%
