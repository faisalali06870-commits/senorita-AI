@echo off
title Senorita AI - Desktop Assistant
echo ========================================================
echo          SENORITA AI - STARTING DESKTOP ASSISTANT
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Launching Senorita AI Engine on port 3000...
start /b cmd /c "node backend/server.js"

echo [2/2] Waiting for engine to initialize...
timeout /t 2 /nobreak >nul

echo [3/3] Opening Senorita AI in Dedicated Desktop Mode...
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:3000
    exit
)

where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:3000
    exit
)

start http://localhost:3000
exit
