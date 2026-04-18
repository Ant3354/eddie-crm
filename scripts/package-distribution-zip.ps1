# Build desktop EXEs, assemble distribution (readme, launchers, autorun), zip to Desktop as ONE file.
param(
  [switch] $SkipBuild,
  [switch] $SkipZip,
  [switch] $IncludeWinUnpacked
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$pkg = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$ver = $pkg.version

if (-not $SkipBuild) {
  Write-Host "Building desktop package (may take several minutes)..."
  npm run build:desktop
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$release = Join-Path $root 'release'
if (-not (Test-Path $release)) {
  Write-Error "Missing release folder. Run npm run build:desktop first."
  exit 1
}

$desktop = [Environment]::GetFolderPath('Desktop')
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$stageName = "Eddie-CRM-Distribution_$stamp"
$stage = Join-Path $desktop $stageName
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

Get-ChildItem $release | ForEach-Object {
  if ($_.Name -eq 'win-unpacked' -and -not $IncludeWinUnpacked) { return }
  Copy-Item $_.FullName -Destination (Join-Path $stage $_.Name) -Recurse -Force
}

$allExes = @(Get-ChildItem $stage -Filter '*.exe' -ErrorAction SilentlyContinue)
$setupExe = $allExes | Where-Object { $_.Name -match 'Setup' } | Select-Object -First 1
$portableExe = $allExes | Where-Object { $_.Name -notmatch 'Setup' } | Select-Object -First 1

if (-not $setupExe) {
  Write-Warning "Setup EXE not found (expected Eddie CRM-Setup-*.exe). Check electron-builder output."
}
if (-not $portableExe) {
  Write-Host "Note: No portable EXE in release (optional). Re-run npm run build:desktop to build NSIS + portable targets."
}

$setupName = if ($setupExe) { $setupExe.Name } else { '' }
$portableName = if ($portableExe) { $portableExe.Name } else { '' }

# --- 00_READ_ME_FIRST.txt (sorts first in Explorer) ---
$readme = @"
EDDIE CRM — send this ONE zip file
==================================

Quick start (normal user, clean Windows PC)
-------------------------------------------
1. Unzip this entire folder anywhere (Desktop is fine).

2. Double-click:  START_HERE.cmd
   - Choose [1] to install (recommended), or [2] for portable (USB / no install).

3. You do NOT need Node.js, Python, or .NET to run the installed app.
   The Eddie CRM window opens automatically after install.

4. If the window is blank or the app crashes on first run:
   Double-click:  Install-Windows-Prerequisites.cmd
   (installs VC++ runtime, WebView2, optional .NET 8 — uses Windows winget)

USB autorun note
----------------
autorun.inf is included for older Windows / some corporate builds.
Windows 10/11 usually blocks USB autorun for security — that is normal.
Use START_HERE.cmd manually.

Files in this folder
--------------------
- Eddie CRM-Setup-$ver.exe   = Windows installer (recommended)
- Eddie CRM $ver.exe         = portable (no install), if present
- START_HERE.cmd             = menu to install or run portable
- Install-Windows-Prerequisites.cmd = optional runtimes (winget)
- Install-Optional-Python.cmd       = Python only if YOU need it for other scripts

Data location after install
---------------------------
%APPDATA%\\eddie-crm\\.env  and bundled SQLite (see app documentation).

"@

Set-Content -Path (Join-Path $stage '00_READ_ME_FIRST.txt') -Value $readme -Encoding utf8

# --- START_HERE.cmd (always pauses; never flashes closed) ---
$startHere = @"
@echo off
setlocal EnableDelayedExpansion
title Eddie CRM — START HERE
cd /d "%~dp0"

echo.
echo ============================================================
echo   Eddie CRM — launcher
echo ============================================================
echo.
if not exist "00_READ_ME_FIRST.txt" (
  echo Tip: open 00_READ_ME_FIRST.txt in Notepad for instructions.
  echo.
)

set "SETUPNAME=$setupName"
set "PORTNAME=$portableName"

if not defined SETUPNAME set "SETUPNAME="
if not defined PORTNAME set "PORTNAME="

echo Choose:
echo   [1] Run INSTALLER (recommended — Start Menu / Desktop shortcut^)
echo   [2] Run PORTABLE app (no install — good for USB^)
echo   [3] Install optional prerequisites (if app crashes / blank window^)
echo   [4] Exit
echo.
set /p CH=Enter 1-4: 

if "!CH!"=="1" goto :do_setup
if "!CH!"=="2" goto :do_portable
if "!CH!"=="3" (
  call "%~dp0Install-Windows-Prerequisites.cmd"
  goto :end
)
if "!CH!"=="4" goto :end
goto :end

:do_setup
if "!SETUPNAME!"=="" (
  echo.
  echo [ERROR] Installer EXE not found. Expected: Eddie CRM-Setup-*.exe
  echo Re-download the full zip or rebuild on the developer PC.
  goto :pause_err
)
echo.
echo Starting installer: !SETUPNAME!
start "" "%~dp0!SETUPNAME!"
goto :end

:do_portable
if "!PORTNAME!"=="" (
  echo.
  echo [ERROR] Portable EXE not found.
  goto :pause_err
)
echo.
echo Starting portable: !PORTNAME!
start "" "%~dp0!PORTNAME!"
goto :end

:pause_err
echo.
echo Press any key to close.
pause >nul
exit /b 1

:end
echo.
echo Done. (Installer/portable was started in a separate window if you chose 1 or 2.^)
echo Press any key to close.
pause >nul
exit /b 0
"@

Set-Content -Path (Join-Path $stage 'START_HERE.cmd') -Value $startHere -Encoding ascii

Copy-Item (Join-Path $PSScriptRoot 'Install-Windows-Prerequisites.cmd') -Destination $stage -Force
Copy-Item (Join-Path $PSScriptRoot 'Install-Optional-Python.cmd') -Destination $stage -Force

# --- autorun.inf (best-effort; USB autorun often disabled on Win10/11) ---
if ($setupName) {
  $autorun = @"
[autorun]
open=$setupName
action=Install Eddie CRM
label=Eddie CRM $ver
icon=$setupName
"@
  Set-Content -Path (Join-Path $stage 'autorun.inf') -Value $autorun -Encoding ascii
}

$log = Join-Path $root 'agent-implementation-log.txt'
Add-Content -Path $log -Value "$(Get-Date -Format 'o') package-distribution-zip -> $stage (zip=$(-not $SkipZip))"

if ($SkipZip) {
  Write-Host "Distribution folder (no zip): $stage"
  Start-Process explorer.exe $stage
  exit 0
}

$zipName = "Eddie-CRM-Complete-v$ver-$stamp.zip"
$zipPath = Join-Path $desktop $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Write-Host "Creating zip: $zipPath"
Compress-Archive -Path $stage -DestinationPath $zipPath -Force

Write-Host "Done."
Write-Host "  Folder: $stage"
Write-Host "  Zip:    $zipPath"
Start-Process explorer.exe -ArgumentList "/select,$zipPath"
