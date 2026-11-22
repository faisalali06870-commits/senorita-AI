$wshell = New-Object -ComObject WScript.Shell

$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
$targetVbs = Join-Path $scriptDir "Senorita-AI-Desktop.vbs"

# 1. Desktop Shortcut
$desktopPath = [Environment]::GetFolderPath('Desktop')
$desktopLnk = Join-Path $desktopPath "Senorita AI.lnk"
$shortcut = $wshell.CreateShortcut($desktopLnk)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$targetVbs`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Senorita AI - Executive Desktop Assistant"
$shortcut.IconLocation = "shell32.dll,43"
$shortcut.Save()
Write-Host "Created Desktop Shortcut: $desktopLnk"

# 2. Windows Startup Shortcut (Runs when laptop powers on)
$startupPath = [Environment]::GetFolderPath('Startup')
$startupLnk = Join-Path $startupPath "Senorita AI.lnk"
$startupShortcut = $wshell.CreateShortcut($startupLnk)
$startupShortcut.TargetPath = "wscript.exe"
$startupShortcut.Arguments = "`"$targetVbs`""
$startupShortcut.WorkingDirectory = $scriptDir
$startupShortcut.Description = "Senorita AI Background Startup Assistant"
$startupShortcut.IconLocation = "shell32.dll,43"
$startupShortcut.Save()
Write-Host "Created Startup Shortcut: $startupLnk"

Write-Host "`nSUCCESS: Senorita AI is fully configured to run natively on your laptop without any browser!" -ForegroundColor Green
