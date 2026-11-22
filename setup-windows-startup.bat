@echo off
title Setup Senorita AI Windows Startup
echo ========================================================
echo       INSTALL SENORITA AI TO WINDOWS AUTO-STARTUP
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_BAT=%SCRIPT_DIR%start-senorita-desktop.bat
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_VBS=%TEMP%\CreateSenoritaShortcut.vbs

echo Creating Windows Startup Shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_VBS%"
echo sLinkFile = "%STARTUP_DIR%\Senorita AI.lnk" >> "%SHORTCUT_VBS%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_VBS%"
echo oLink.TargetPath = "%TARGET_BAT%" >> "%SHORTCUT_VBS%"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> "%SHORTCUT_VBS%"
echo oLink.WindowStyle = 7 >> "%SHORTCUT_VBS%"
echo oLink.Description = "Senorita AI Executive Desktop Assistant" >> "%SHORTCUT_VBS%"
echo oLink.Save >> "%SHORTCUT_VBS%"

cscript /nologo "%SHORTCUT_VBS%"
del "%SHORTCUT_VBS%"

echo.
echo ========================================================
echo SUCCESS! Senorita AI will now start automatically whenever
echo you turn on your laptop!
echo.
echo Startup file location:
echo %STARTUP_DIR%\Senorita AI.lnk
echo ========================================================
echo.
pause
