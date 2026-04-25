@echo off
REM Do not use "npm run" in PowerShell if npm shows "Could not determine Node.js install directory".
cd /d "%~dp0"
node "%~dp0..\mobile_frontend\scripts\eas-android-build.mjs" preview
exit /b %ERRORLEVEL%
