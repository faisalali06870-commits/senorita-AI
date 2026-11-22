@echo off
title Senorita-AI Live Public URL Generator
echo ======================================================
echo    SENORITA-AI: Free Public HTTPS Live URL Generator
echo ======================================================
echo.
echo Checking if backend is running on port 3000...
echo.

echo Starting instant secure public tunnel...
echo (You can open the generated URL on your phone or share it with anyone!)
echo.

npx.cmd localtunnel --port 3000

pause
