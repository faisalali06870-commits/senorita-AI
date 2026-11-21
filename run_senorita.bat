@echo off
title SENORITA-AI
cd /d "%~dp0"

echo =====================================================
echo           Starting SENORITA-AI Assistant
echo =====================================================
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Free port 3000 if previously occupied by a stray process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Freeing port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting Senorita-AI server on http://localhost:3000...
cd backend

:: Automatically launch browser after 2 seconds
start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"

:: Start Node.js server
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server encountered an error.
    pause
)
