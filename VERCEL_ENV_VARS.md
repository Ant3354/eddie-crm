# Vercel Environment Variables

Copy these to your Vercel project → Settings → Environment Variables

## Required Variables

Add these to **BOTH** Production and Preview:

```
DATABASE_URL = <your Neon Postgres URL from neon.tech — never commit>
```

```
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```
*(Update this after first deployment with your actual Vercel URL)*

```
JWT_SECRET = [Generate: -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})]
```
*(Run in PowerShell to generate)*

```
CRON_SECRET = [Generate: (New-Guid).ToString()]
```
*(Run in PowerShell to generate)*

## Optional Variables (Add if needed)

### Email Configuration
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_SECURE = false
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
SMTP_FROM_EMAIL = noreply@yourdomain.com
```

### SMS Configuration
```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = your-auth-token
TWILIO_PHONE_NUMBER = +1234567890
```

### Support Information
```
SUPPORT_PHONE = +1234567890
SUPPORT_EMAIL = support@yourdomain.com
SUPPORT_CHAT_URL = https://support.yourdomain.com
```

## How to Add in Vercel

1. Go to your Vercel project
2. Click "Settings" → "Environment Variables"
3. For each variable:
   - Click "Add New"
   - Enter variable name
   - Enter variable value
   - Select "Production" and "Preview"
   - Click "Save"

## Generate Secrets

Run these in PowerShell to generate secure secrets:

```powershell
# Generate JWT_SECRET (32 characters)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate CRON_SECRET (UUID)
(New-Guid).ToString()
```

