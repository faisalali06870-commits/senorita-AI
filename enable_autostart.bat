@echo off
title Enable Senorita-AI Auto-Start on Boot
echo ======================================================
echo    SENORITA-AI: Enabling Windows Auto-Start
echo ======================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_VBS=%SCRIPT_DIR%start_senorita_desktop.vbs
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Senorita-AI.lnk

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_VBS%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Senorita-AI Desktop Companion'; $s.Save()"

echo [SUCCESS] Senorita-AI has been added to Windows Startup!
echo.
echo Now whenever you turn on your laptop:
echo  1. Senorita backend will start silently in the background (no black window).
echo  2. Senorita will open as a Standalone Desktop Application (no browser tabs/bars).
echo  3. You can speak to Senorita and control your laptop hands-free!
echo.
echo (To disable auto-start anytime, simply run 'disable_autostart.bat')
echo ======================================================
pause
