@echo off
title Senorita AI Background Engine
cd /d "%~dp0"

:loop
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" backend/server.js
) else (
    node backend/server.js
)
timeout /t 2 >nul
goto loop
