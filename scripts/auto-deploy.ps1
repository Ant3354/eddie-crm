# Automated Deployment Script for EDDIE CRM
# This script handles the entire deployment process

param(
    [string]$DatabaseUrl = "postgresql://neondb_owner:npg_K8yGqg0PrOQw@ep-proud-feather-ah5r6q3c-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

Write-Host "=== EDDIE CRM - Automated Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate secrets
Write-Host "Step 1: Generating secure secrets..." -ForegroundColor Yellow
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$cronSecret = (New-Guid).ToString()
Write-Host "✅ Secrets generated" -ForegroundColor Green

# Step 2: Install Vercel CLI if needed
Write-Host "`nStep 2: Checking Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
    npm i -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Vercel CLI ready" -ForegroundColor Green

# Step 3: Login to Vercel
Write-Host "`nStep 3: Vercel authentication..." -ForegroundColor Yellow
Write-Host "Please login to Vercel when prompted..." -ForegroundColor Cyan
vercel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel login failed" -ForegroundColor Red
    exit 1
}

# Step 4: Link project
Write-Host "`nStep 4: Linking Vercel project..." -ForegroundColor Yellow
vercel link --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}

# Step 5: Set environment variables
Write-Host "`nStep 5: Setting environment variables..." -ForegroundColor Yellow

Write-Host "Setting DATABASE_URL..." -ForegroundColor Cyan
echo $DatabaseUrl | vercel env add DATABASE_URL production
echo $DatabaseUrl | vercel env add DATABASE_URL preview

Write-Host "Setting JWT_SECRET..." -ForegroundColor Cyan
echo $jwtSecret | vercel env add JWT_SECRET production
echo $jwtSecret | vercel env add JWT_SECRET preview

Write-Host "Setting CRON_SECRET..." -ForegroundColor Cyan
echo $cronSecret | vercel env add CRON_SECRET production
echo $cronSecret | vercel env add CRON_SECRET preview

Write-Host "⚠️ NEXT_PUBLIC_APP_URL will be set after first deployment" -ForegroundColor Yellow
Write-Host "✅ Environment variables set" -ForegroundColor Green

# Step 6: Deploy
Write-Host "`nStep 6: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Deploying preview..." -ForegroundColor Cyan
$previewOutput = vercel --yes 2>&1
Write-Host $previewOutput

# Extract URL from output
$previewUrl = ""
if ($previewOutput -match 'https://[^\s]+\.vercel\.app') {
    $previewUrl = $matches[0]
    Write-Host "✅ Preview deployed: $previewUrl" -ForegroundColor Green
}

Write-Host "`nDeploying to production..." -ForegroundColor Cyan
$prodOutput = vercel --prod --yes 2>&1
Write-Host $prodOutput

# Extract production URL
$prodUrl = ""
if ($prodOutput -match 'https://[^\s]+\.vercel\.app') {
    $prodUrl = $matches[0]
    Write-Host "✅ Production deployed: $prodUrl" -ForegroundColor Green
}

# Step 7: Update NEXT_PUBLIC_APP_URL
if ($prodUrl) {
    Write-Host "`nStep 7: Updating NEXT_PUBLIC_APP_URL..." -ForegroundColor Yellow
    echo $prodUrl | vercel env add NEXT_PUBLIC_APP_URL production
    echo $prodUrl | vercel env add NEXT_PUBLIC_APP_URL preview
    Write-Host "✅ App URL updated to: $prodUrl" -ForegroundColor Green
    
    Write-Host "`nRedeploying with updated URL..." -ForegroundColor Cyan
    vercel --prod --yes | Out-Null
}

# Summary
Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Cyan
if ($prodUrl) {
    Write-Host "  🌐 $prodUrl" -ForegroundColor White
} else {
    Write-Host "  🌐 Check Vercel dashboard for URL" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update JotForm webhook to: $prodUrl/api/webhooks/jotform" -ForegroundColor White
Write-Host "  2. Test login at: $prodUrl/login" -ForegroundColor White
Write-Host "  3. Admin credentials:" -ForegroundColor White
Write-Host "     Email: admin@eddiecrm.com" -ForegroundColor White
Write-Host "     Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "✅ All done! Your CRM is live!" -ForegroundColor Green

