@echo off
REM EDDIE CRM Automated Installation Script (Batch Version)
echo ========================================
echo EDDIE CRM - Automated Installation
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to: https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Run the installer
    echo 4. Restart this terminal
    echo 5. Run this script again: install.bat
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
)

node --version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not working properly
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Check npm
echo Checking for npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is NOT available!
    echo npm should come with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
)

npm --version
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not working properly
    exit /b 1
)

echo [OK] npm found
echo.

echo Starting installation process...
echo.

REM Step 1: Install dependencies
echo Step 1/4: Installing dependencies (this may take 2-5 minutes)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 2: Setup environment
echo Step 2/4: Setting up environment file...
call npm run setup
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create environment file
    pause
    exit /b 1
)
echo [OK] Environment file created
echo.

REM Step 3: Generate Prisma client
echo Step 3/4: Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)
echo [OK] Prisma client generated
echo.

REM Step 4: Initialize database
echo Step 4/4: Initializing database...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to initialize database
    pause
    exit /b 1
)
echo [OK] Database initialized
echo.

echo ========================================
echo [OK] Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. (Optional) Edit .env file with your email/SMS credentials
echo 2. Start the server: npm run dev
echo 3. Open browser: http://localhost:3000
echo.
pause

