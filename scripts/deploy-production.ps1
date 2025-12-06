# EDDIE CRM - Production Deployment Script
# This script helps you deploy to Vercel + Neon

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$AppUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$JwtSecret = "",
    
    [Parameter(Mandatory=$false)]
    [string]$CronSecret = ""
)

Write-Host "=== EDDIE CRM - Production Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Update Prisma schema for PostgreSQL
Write-Host "Step 1: Updating Prisma schema for PostgreSQL..." -ForegroundColor Yellow
$schemaPath = "prisma\schema.prisma"
$schemaContent = Get-Content $schemaPath -Raw
if ($schemaContent -match 'provider = "sqlite"') {
    $schemaContent = $schemaContent -replace 'provider = "sqlite"', 'provider = "postgresql"'
    Set-Content -Path $schemaPath -Value $schemaContent
    Write-Host "✅ Updated schema to PostgreSQL" -ForegroundColor Green
} else {
    Write-Host "✅ Schema already configured for PostgreSQL" -ForegroundColor Green
}

# Step 2: Set local DATABASE_URL and push schema
Write-Host "`nStep 2: Pushing schema to Neon database..." -ForegroundColor Yellow
$env:DATABASE_URL = $DatabaseUrl
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push schema to database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Schema pushed successfully" -ForegroundColor Green

# Step 3: Create admin user
Write-Host "`nStep 3: Creating admin user..." -ForegroundColor Yellow
$adminEmail = Read-Host "Enter admin email (or press Enter to skip)"
if ($adminEmail) {
    $adminPassword = Read-Host "Enter admin password" -AsSecureString
    $adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
    )
    $adminName = Read-Host "Enter admin name (or press Enter for 'Admin User')"
    if (-not $adminName) { $adminName = "Admin User" }
    
    npm run create-admin $adminEmail $adminPasswordPlain $adminName
    Write-Host "✅ Admin user created" -ForegroundColor Green
} else {
    Write-Host "⚠️ Skipping admin user creation" -ForegroundColor Yellow
}

# Step 4: Install Vercel CLI if needed
Write-Host "`nStep 4: Checking Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Vercel CLI ready" -ForegroundColor Green

# Step 5: Login to Vercel
Write-Host "`nStep 5: Vercel authentication..." -ForegroundColor Yellow
Write-Host "Please login to Vercel if prompted..." -ForegroundColor Cyan
vercel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel login failed" -ForegroundColor Red
    exit 1
}

# Step 6: Link project
Write-Host "`nStep 6: Linking Vercel project..." -ForegroundColor Yellow
vercel link --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}

# Step 7: Set environment variables
Write-Host "`nStep 7: Setting environment variables..." -ForegroundColor Yellow

# Generate secrets if not provided
if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
    $JwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
}
if ([string]::IsNullOrWhiteSpace($CronSecret)) {
    $CronSecret = [guid]::NewGuid().ToString()
}

# Required variables
Write-Host "Setting DATABASE_URL..." -ForegroundColor Cyan
echo $DatabaseUrl | vercel env add DATABASE_URL production
echo $DatabaseUrl | vercel env add DATABASE_URL preview

Write-Host "Setting JWT_SECRET..." -ForegroundColor Cyan
echo $JwtSecret | vercel env add JWT_SECRET production
echo $JwtSecret | vercel env add JWT_SECRET preview

Write-Host "Setting CRON_SECRET..." -ForegroundColor Cyan
echo $CronSecret | vercel env add CRON_SECRET production
echo $CronSecret | vercel env add CRON_SECRET preview

if (-not [string]::IsNullOrWhiteSpace($AppUrl)) {
    Write-Host "Setting NEXT_PUBLIC_APP_URL..." -ForegroundColor Cyan
    echo $AppUrl | vercel env add NEXT_PUBLIC_APP_URL production
    echo $AppUrl | vercel env add NEXT_PUBLIC_APP_URL preview
} else {
    Write-Host "⚠️ NEXT_PUBLIC_APP_URL not set. You'll need to set it after first deploy." -ForegroundColor Yellow
}

# Optional variables
Write-Host "`nOptional: Set email/SMS variables? (y/n)" -ForegroundColor Cyan
$setOptional = Read-Host
if ($setOptional -eq 'y') {
    $smtpHost = Read-Host "SMTP_HOST (or press Enter to skip)"
    if ($smtpHost) {
        echo $smtpHost | vercel env add SMTP_HOST production
        echo $smtpHost | vercel env add SMTP_HOST preview
    }
    
    $smtpUser = Read-Host "SMTP_USER (or press Enter to skip)"
    if ($smtpUser) {
        echo $smtpUser | vercel env add SMTP_USER production
        echo $smtpUser | vercel env add SMTP_USER preview
    }
    
    $smtpPass = Read-Host "SMTP_PASSWORD (or press Enter to skip)" -AsSecureString
    if ($smtpPass) {
        $smtpPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass)
        )
        echo $smtpPassPlain | vercel env add SMTP_PASSWORD production
        echo $smtpPassPlain | vercel env add SMTP_PASSWORD preview
    }
}

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Step 8: Deploy
Write-Host "`nStep 8: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Deploying preview..." -ForegroundColor Cyan
vercel --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Preview deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`nDeploying to production..." -ForegroundColor Cyan
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Production deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your Vercel URL from the deployment output" -ForegroundColor White
Write-Host "2. Update NEXT_PUBLIC_APP_URL in Vercel dashboard to your production URL" -ForegroundColor White
Write-Host "3. Update JotForm webhook URL to: https://your-app.vercel.app/api/webhooks/jotform" -ForegroundColor White
Write-Host "4. Test your deployment!" -ForegroundColor White
Write-Host ""
Write-Host "Your app should be live at: https://your-app.vercel.app" -ForegroundColor Green

