@echo off
title Setup Senorita AI Native Desktop JARVIS
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0Setup-Desktop-JARVIS.ps1"
echo.
echo ======================================================================
echo Press any key to finish setup...
echo ======================================================================
pause >nul
