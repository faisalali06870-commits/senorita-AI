@echo off
title Create Senorita-AI Desktop Shortcut
echo ======================================================
echo    Creating Senorita-AI Desktop Application Shortcut...
echo ======================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_VBS=%SCRIPT_DIR%start_senorita_desktop.vbs
set DESKTOP_DIR=%USERPROFILE%\Desktop
set SHORTCUT_PATH=%DESKTOP_DIR%\Senorita AI.lnk

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_VBS%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Senorita-AI Desktop Assistant'; $s.Save()"

echo [SUCCESS] 'Senorita AI' shortcut created on your Desktop!
echo Double-click 'Senorita AI' on your Desktop anytime to launch it as a Standalone App.
echo.
pause
