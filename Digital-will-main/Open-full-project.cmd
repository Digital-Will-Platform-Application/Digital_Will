@echo off
REM Opens the REAL project (mobile_frontend, backend, web) in your default editor for .code-workspace files.
REM If Cursor is default, you get the full tree in the left panel.
cd /d "%~dp0"
start "" "%~dp0digital-will-full.code-workspace"
exit /b 0
