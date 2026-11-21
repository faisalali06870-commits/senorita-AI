@echo off
title Disable Senorita-AI Auto-Start
echo ======================================================
echo    SENORITA-AI: Disabling Windows Auto-Start
echo ======================================================
echo.

set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Senorita-AI.lnk

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo [SUCCESS] Auto-start removed! Senorita-AI will no longer start at boot.
) else (
    echo Auto-start shortcut was not found.
)

echo.
pause
