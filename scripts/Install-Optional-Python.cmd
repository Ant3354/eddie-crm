@echo off
setlocal
title Eddie CRM — optional Python 3 (for scripts only^)
cd /d "%~dp0"

echo.
echo ============================================================
echo   Optional: Python 3 (NOT required for Eddie CRM itself^)
echo ============================================================
echo.
echo The Eddie CRM desktop app does not use Python.
echo Install this only if you plan to run separate Python scripts.
echo.
pause

where winget >nul 2>&1
if errorlevel 1 (
  echo [ERROR] winget was not found. Install App Installer from Microsoft Store.
  echo.
  pause
  exit /b 1
)

echo Installing Python 3.12 (user scope^) ...
winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo WARNING: Install may have failed or Python may already exist.
) else (
  echo OK: Python installer finished. Open a NEW Command Prompt and run: python --version
)

echo.
pause
exit /b 0
