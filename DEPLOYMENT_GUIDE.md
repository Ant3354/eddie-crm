# 🚀 Production Deployment Guide

## Quick Deploy: Vercel + Neon (Free Tier)

This guide will help you deploy EDDIE CRM to production using:
- **Vercel** (hosting) - Free tier available
- **Neon** (PostgreSQL database) - Free tier available

---

## Step 1: Set Up Neon PostgreSQL Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Click "Create Project"
4. Name your project (e.g., "eddie-crm")
5. Select a region closest to you
6. Click "Create Project"

### 1.2 Get Database Connection String
1. In your Neon dashboard, click on your project
2. Go to "Connection Details"
3. Copy the **Connection String** (it looks like: `postgres://user:password@host/dbname?sslmode=require`)
4. **Save this** - you'll need it in Step 3

### 1.3 Update Prisma Schema for PostgreSQL
The schema is already configured for SQLite. We need to update it for PostgreSQL:

**Update `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 2: Push Database Schema to Neon

### 2.1 Set Database URL Locally
Create/update your `.env` file:
```env
DATABASE_URL="postgres://user:password@host/dbname?sslmode=require"
```

Replace with your actual Neon connection string.

### 2.2 Push Schema
```bash
npx prisma generate
npx prisma db push
```

This will create all tables in your Neon database.

### 2.3 Create Admin User
```bash
npm run create-admin your-email@example.com your-password "Admin Name"
```

---

## Step 3: Deploy to Vercel

### 3.1 Prepare Your Code
1. Make sure all changes are committed to Git
2. Push to GitHub (if not already)

### 3.2 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository

### 3.3 Configure Project Settings
- **Framework Preset:** Next.js
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 3.4 Add Environment Variables

In Vercel project settings → Environment Variables, add:

#### Required Variables:
```
DATABASE_URL = postgres://user:password@host/dbname?sslmode=require
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
JWT_SECRET = [generate a random 32+ character string]
CRON_SECRET = [generate a random UUID]
```

#### Optional Variables (for full functionality):
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_SECURE = false
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
SMTP_FROM_EMAIL = noreply@yourdomain.com

TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = your-auth-token
TWILIO_PHONE_NUMBER = +1234567890

SUPPORT_PHONE = +1234567890
SUPPORT_EMAIL = support@yourdomain.com
SUPPORT_CHAT_URL = https://support.yourdomain.com
```

**Important:** Add these to **BOTH** Preview and Production environments!

### 3.5 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Copy your deployment URL (e.g., `https://your-app.vercel.app`)

### 3.6 Update NEXT_PUBLIC_APP_URL
1. Go back to Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Redeploy (or it will auto-redeploy)

---

## Step 4: Post-Deployment Setup

### 4.1 Update JotForm Webhook
1. Go to your JotForm: https://form.jotform.com/253266939811163
2. Settings → Integrations → Webhooks
3. Update webhook URL to: `https://your-app.vercel.app/api/webhooks/jotform`
4. Save

### 4.2 Test Your Deployment
1. Visit: `https://your-app.vercel.app`
2. Register a new account or login
3. Test creating a contact
4. Test QR code generation
5. Submit a test form to verify webhook

### 4.3 Verify Database
1. Go to Neon dashboard
2. Check "Tables" - you should see all your tables
3. Run a query to verify data is being stored

---

## Step 5: Automated Deployment Script

For easier deployment, use the provided script:

```powershell
# Install Vercel CLI if needed
npm i -g vercel

# Run deployment script
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 `
  -AppUrl "https://your-app.vercel.app" `
  -DatabaseUrl "postgres://user:password@host/dbname?sslmode=require" `
  -CronSecret "$(New-Guid)"
```

---

## Environment Variables Reference

### Required for Production:
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgres://user:pass@host/db?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | Random string |
| `CRON_SECRET` | Secret for cron job security | Random UUID |

### Optional (for Email/SMS):
| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM_EMAIL` | From email address |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (+1234567890) |

### Optional (for Support):
| Variable | Description |
|----------|-------------|
| `SUPPORT_PHONE` | Support phone number |
| `SUPPORT_EMAIL` | Support email |
| `SUPPORT_CHAT_URL` | Support chat URL |

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection status
- Ensure SSL mode is enabled (`?sslmode=require`)

### Build Failures
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version (18+)

### Webhook Not Working
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check JotForm webhook URL matches your Vercel URL
- Check Vercel function logs for errors

### Authentication Issues
- Verify `JWT_SECRET` is set
- Check cookies are working (HTTPS required)
- Clear browser cache and cookies

---

## Production Checklist

- [ ] Neon database created and schema pushed
- [ ] Admin user created
- [ ] Vercel project created and deployed
- [ ] All environment variables set
- [ ] `NEXT_PUBLIC_APP_URL` updated to production URL
- [ ] JotForm webhook updated to production URL
- [ ] Test login/registration
- [ ] Test contact creation
- [ ] Test QR code generation
- [ ] Test form submission via webhook
- [ ] Verify database is storing data
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics (optional)

---

## Next Steps After Deployment

1. **Custom Domain** (Optional):
   - In Vercel, go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Monitor Performance**:
   - Check Vercel Analytics
   - Monitor Neon database usage
   - Set up error tracking (optional)

3. **Backup Strategy**:
   - Neon provides automatic backups
   - Consider exporting data periodically

4. **Scale as Needed**:
   - Vercel scales automatically
   - Neon free tier: 0.5GB storage, good for testing
   - Upgrade when needed

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Neon database logs
3. Review environment variables
4. Test locally first with production database URL

**Your production URL will be:** `https://your-app.vercel.app`

Good luck with your deployment! 🚀

