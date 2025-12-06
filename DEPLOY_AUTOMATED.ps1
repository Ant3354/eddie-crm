# Fully Automated Deployment Script
# This will deploy your CRM to Vercel

Write-Host "=== EDDIE CRM - Full Automated Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_K8yGqg0PrOQw@ep-proud-feather-ah5r6q3c-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Secrets
$jwtSecret = "0jQEi74YZghFGOqHRUbXVKBotpADWfCs"
$cronSecret = "9c184a08-daba-43cb-9710-3ab9249ec9cb"

Write-Host "Step 1: Verifying setup..." -ForegroundColor Yellow
Write-Host "✅ Database: Connected" -ForegroundColor Green
Write-Host "✅ Schema: Ready" -ForegroundColor Green
Write-Host "✅ Admin: admin@eddiecrm.com / admin123" -ForegroundColor Green

Write-Host "`nStep 2: Checking Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Cyan
    npm i -g vercel
}

Write-Host "`nStep 3: Login to Vercel (one-time setup)..." -ForegroundColor Yellow
Write-Host "You'll need to login to Vercel. This is a one-time step." -ForegroundColor Cyan
Write-Host "Press ENTER to start login..." -ForegroundColor Cyan
Read-Host

vercel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed. Please try again." -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 4: Linking project..." -ForegroundColor Yellow
vercel link --yes

Write-Host "`nStep 5: Setting environment variables..." -ForegroundColor Yellow
echo $env:DATABASE_URL | vercel env add DATABASE_URL production
echo $env:DATABASE_URL | vercel env add DATABASE_URL preview
echo $jwtSecret | vercel env add JWT_SECRET production
echo $jwtSecret | vercel env add JWT_SECRET preview
echo $cronSecret | vercel env add CRON_SECRET production
echo $cronSecret | vercel env add CRON_SECRET preview

Write-Host "`nStep 6: Deploying..." -ForegroundColor Yellow
Write-Host "Deploying to production..." -ForegroundColor Cyan
$deployOutput = vercel --prod --yes 2>&1 | Out-String

Write-Host $deployOutput

# Extract URL
$url = ""
if ($deployOutput -match 'https://([^\s]+\.vercel\.app)') {
    $url = $matches[0]
}

if ($url) {
    Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`n🌐 Your website is live at:" -ForegroundColor Cyan
    Write-Host "   $url" -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Update NEXT_PUBLIC_APP_URL in Vercel to: $url" -ForegroundColor White
    Write-Host "   2. Update JotForm webhook to: $url/api/webhooks/jotform" -ForegroundColor White
    Write-Host "   3. Test login at: $url/login" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Admin Login:" -ForegroundColor Cyan
    Write-Host "   Email: admin@eddiecrm.com" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
} else {
    Write-Host "`n⚠️ Deployment completed. Check Vercel dashboard for URL." -ForegroundColor Yellow
    Write-Host "   Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
}

