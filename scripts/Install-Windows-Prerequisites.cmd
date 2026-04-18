@echo off
setlocal EnableDelayedExpansion
title Eddie CRM — Windows prerequisites
cd /d "%~dp0"

echo.
echo ============================================================
echo   Eddie CRM — install optional Windows prerequisites
echo ============================================================
echo.
echo Use this if the app window is blank, crashes on launch, or
echo Windows reports missing VCRUNTIME / WebView2 / .NET.
echo.
echo The Eddie CRM Setup EXE usually works without this step.
echo.
pause

where winget >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] winget was not found.
  echo.
  echo Install "App Installer" from the Microsoft Store, or use
  echo Windows 10/11 with updates, then run this script again.
  echo.
  echo Press any key to close.
  pause >nul
  exit /b 1
)

echo.
echo --- Microsoft Visual C++ 2015-2022 Redistributable x64 ---
winget install --id Microsoft.VCRedist.2015+.x64 -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo WARNING: VC++ step returned an error (may already be installed^).
) else (
  echo OK: VC++ step finished.
)

echo.
echo --- Microsoft Edge WebView2 Runtime (some systems need this^) ---
winget install --id Microsoft.EdgeWebView2Runtime -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo WARNING: WebView2 step returned an error (may already be installed^).
) else (
  echo OK: WebView2 step finished.
)

echo.
echo --- .NET Desktop Runtime 8 x64 (optional^) ---
winget install --id Microsoft.DotNet.DesktopRuntime.8 -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo WARNING: .NET step returned an error (may already be installed^).
) else (
  echo OK: .NET step finished.
)

echo.
echo ============================================================
echo Done. Run 00_READ_ME_FIRST.txt (open in Notepad^) or START_HERE.cmd
echo ============================================================
echo.
echo Press any key to close.
pause >nul
exit /b 0
