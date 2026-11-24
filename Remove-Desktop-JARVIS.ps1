$desktopFolder = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)
$startupFolder = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)

$desktopLnk = Join-Path $desktopFolder "Senorita AI.lnk"
$startupLnk = Join-Path $startupFolder "Senorita AI.lnk"

Write-Host "Checking: $desktopLnk"
if (Test-Path $desktopLnk) {
    Remove-Item -Path $desktopLnk -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Desktop shortcut removed."
} else {
    Write-Host "INFO: Desktop shortcut already not present."
}

Write-Host "Checking: $startupLnk"
if (Test-Path $startupLnk) {
    Remove-Item -Path $startupLnk -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Startup shortcut removed."
} else {
    Write-Host "INFO: Startup shortcut already not present."
}

# Stop any lingering background node process running Senorita AI
$procs = Get-Process node -ErrorAction SilentlyContinue
if ($procs) {
    $procs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Background node processes stopped."
} else {
    Write-Host "INFO: No background processes running."
}
