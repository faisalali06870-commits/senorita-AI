@echo off
title Senorita-AI GitHub Sync
echo ======================================================
echo    SENORITA-AI: Syncing all changes to GitHub...
echo ======================================================
echo.

git status --short
echo.
echo Staging and committing changes...
git add .
git commit -m "Auto-update Senorita-AI: %date% %time%"
echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ======================================================
echo    [SUCCESS] Senorita-AI is now synced with GitHub!
echo ======================================================
timeout /t 4 >nul
