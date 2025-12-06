param(
  [string]$ProjectName = "eddie-crm",
  [string]$AppUrl = "",
  [string]$DatabaseUrl = "",
  [string]$CronSecret = ""
)

Write-Host "=== EDDIE CRM - Vercel Deploy Helper ===" -ForegroundColor Cyan

# 1. Ensure vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
  npm i -g vercel | Out-Null
}

# 2. Login to Vercel (interactive)
Write-Host "Log into Vercel if prompted..." -ForegroundColor Yellow
vercel login

# 3. Link project
Write-Host "Linking/Creating project..." -ForegroundColor Yellow
$env:VERCEL_ORG_ID=""  # optional preset
$env:VERCEL_PROJECT_ID=""  # optional preset
vercel link --yes

# 4. Set env vars
if ([string]::IsNullOrWhiteSpace($CronSecret)) { $CronSecret = [guid]::NewGuid().ToString() }
if (-not [string]::IsNullOrWhiteSpace($AppUrl)) {
  vercel env add NEXT_PUBLIC_APP_URL <<< "$AppUrl"
}
if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  vercel env add DATABASE_URL <<< "$DatabaseUrl"
}
vercel env add CRON_SECRET <<< "$CronSecret"

# Optional envs
$optional = @('SUPPORT_PHONE','SUPPORT_EMAIL','SUPPORT_CHAT_URL','SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_PASSWORD','SMTP_FROM_EMAIL','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN','TWILIO_PHONE_NUMBER')
foreach($k in $optional){
  $v = (Get-Item env:$k -ErrorAction SilentlyContinue).Value
  if ($v) { vercel env add $k <<< "$v" }
}

# 5. Deploy
Write-Host "Deploying (Preview)..." -ForegroundColor Yellow
vercel --yes

Write-Host "Deploying (Production)..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host "=== Done. Update NEXT_PUBLIC_APP_URL to your final URL and redeploy if needed. ===" -ForegroundColor Green

