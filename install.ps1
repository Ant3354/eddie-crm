# EDDIE CRM Automated Installation Script
# This script will install all dependencies and set up the project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EDDIE CRM - Automated Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "✗ Node.js is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "2. Download the LTS version" -ForegroundColor Cyan
    Write-Host "3. Run the installer" -ForegroundColor Cyan
    Write-Host "4. Restart this terminal/PowerShell" -ForegroundColor Cyan
    Write-Host "5. Run this script again: .\install.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to open Node.js download page..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://nodejs.org/"
    exit 1
}

# Check npm
Write-Host "Checking for npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "✗ npm is NOT available!" -ForegroundColor Red
    Write-Host "npm should come with Node.js. Please reinstall Node.js." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting installation process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1/4: Installing dependencies (this may take 2-5 minutes)..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        throw "npm install failed"
    }
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Setup environment
Write-Host "Step 2/4: Setting up environment file..." -ForegroundColor Yellow
try {
    npm run setup
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Environment file created" -ForegroundColor Green
    } else {
        throw "setup failed"
    }
} catch {
    Write-Host "✗ Failed to create environment file" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Generate Prisma client
Write-Host "Step 3/4: Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma client generated" -ForegroundColor Green
    } else {
        throw "prisma generate failed"
    }
} catch {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Initialize database
Write-Host "Step 4/4: Initializing database..." -ForegroundColor Yellow
try {
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database initialized" -ForegroundColor Green
    } else {
        throw "database initialization failed"
    }
} catch {
    Write-Host "✗ Failed to initialize database" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. (Optional) Edit .env file with your email/SMS credentials" -ForegroundColor White
Write-Host "2. Start the server: npm run dev" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Would you like to start the server now? (Y/N)" -ForegroundColor Cyan
$response = Read-Host
if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop" 
    Write-Host ""
    npm run dev
}

