# ⚡ Quick Deploy Guide

## Fastest Way to Deploy (5 Minutes)

### Prerequisites
- GitHub account
- Neon account (free): https://neon.tech
- Vercel account (free): https://vercel.com

---

## Step 1: Create Neon Database (2 minutes)

1. Go to https://neon.tech and sign up
2. Click "Create Project"
3. Name it "eddie-crm"
4. Copy the **Connection String** (looks like: `postgres://user:pass@host/db?sslmode=require`)
5. **Save this connection string!**

---

## Step 2: Update Prisma Schema (30 seconds)

Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

---

## Step 3: Push Schema to Neon (1 minute)

```bash
# Set your Neon connection string
$env:DATABASE_URL = "postgres://user:pass@host/db?sslmode=require"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create admin user
npm run create-admin admin@yourdomain.com yourpassword "Admin User"
```

---

## Step 4: Deploy to Vercel (2 minutes)

### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

5. **Add Environment Variables:**
   ```
   DATABASE_URL = [your Neon connection string]
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   JWT_SECRET = [generate random 32+ char string]
   CRON_SECRET = [generate random UUID]
   ```

6. Click "Deploy"
7. Wait for deployment
8. Copy your URL (e.g., `https://eddie-crm.vercel.app`)

9. **Update NEXT_PUBLIC_APP_URL:**
   - Go to Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to your actual URL
   - Redeploy

### Option B: Via Script (Automated)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-production.ps1 `
  -DatabaseUrl "postgres://user:pass@host/db?sslmode=require" `
  -AppUrl "https://your-app.vercel.app" `
  -JwtSecret "your-random-secret-32-chars" `
  -CronSecret "$(New-Guid)"
```

---

## Step 5: Update JotForm Webhook (30 seconds)

1. Go to https://form.jotform.com/253266939811163
2. Settings → Integrations → Webhooks
3. Update URL to: `https://your-app.vercel.app/api/webhooks/jotform`
4. Save

---

## Step 6: Test! (1 minute)

1. Visit: `https://your-app.vercel.app`
2. Register/Login
3. Create a contact
4. Generate a QR code
5. Submit a test form

---

## Environment Variables Cheat Sheet

### Required (Minimum):
```
DATABASE_URL = postgres://user:pass@host/db?sslmode=require
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
JWT_SECRET = [random 32+ chars]
CRON_SECRET = [random UUID]
```

### Optional (for Email):
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
SMTP_FROM_EMAIL = noreply@yourdomain.com
```

### Optional (for SMS):
```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = your-auth-token
TWILIO_PHONE_NUMBER = +1234567890
```

---

## Troubleshooting

**Database connection fails:**
- Verify connection string is correct
- Check Neon dashboard for connection status
- Ensure `?sslmode=require` is at the end

**Build fails:**
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify Node.js version (18+)

**Webhook not working:**
- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- Check JotForm webhook URL
- Check Vercel function logs

---

## Your Production URLs

- **App:** https://your-app.vercel.app
- **Dashboard:** https://your-app.vercel.app/dashboard
- **Webhook:** https://your-app.vercel.app/api/webhooks/jotform
- **Database:** Check Neon dashboard

---

## Next Steps

1. ✅ Set up custom domain (optional)
2. ✅ Configure email/SMS (optional)
3. ✅ Set up monitoring
4. ✅ Create backup strategy

**You're live! 🎉**

