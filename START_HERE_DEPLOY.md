# 🚀 START HERE: Production Deployment

## Quick Start (Choose One)

### Option 1: Automated Script (Recommended)
```powershell
# 1. Get your Neon database connection string from neon.tech
# 2. Run the deployment script:
powershell -ExecutionPolicy Bypass -File scripts/deploy-production.ps1 `
  -DatabaseUrl "postgres://user:pass@host/db?sslmode=require"
```

### Option 2: Manual Steps (5 minutes)
Follow **QUICK_DEPLOY.md** for step-by-step instructions.

### Option 3: Detailed Guide
Follow **DEPLOYMENT_GUIDE.md** for comprehensive instructions.

---

## What You Need

1. **Neon Database** (Free)
   - Sign up: https://neon.tech
   - Create project → Copy connection string

2. **Vercel Account** (Free)
   - Sign up: https://vercel.com
   - Connect GitHub → Import project

3. **5 Minutes** ⏱️

---

## Quick Steps

1. **Create Neon Database**
   - Go to neon.tech
   - Create project
   - Copy connection string

2. **Update Prisma Schema**
   - Edit `prisma/schema.prisma`
   - Change `provider = "sqlite"` to `provider = "postgresql"`

3. **Push Schema**
   ```bash
   $env:DATABASE_URL = "your-neon-connection-string"
   npx prisma generate
   npx prisma db push
   npm run create-admin admin@email.com password "Admin"
   ```

4. **Deploy to Vercel**
   - Go to vercel.com
   - Import GitHub repo
   - Add environment variables (see QUICK_DEPLOY.md)
   - Deploy!

5. **Update Webhook**
   - Update JotForm webhook to: `https://your-app.vercel.app/api/webhooks/jotform`

---

## Files Created

- ✅ **QUICK_DEPLOY.md** - 5-minute deployment guide
- ✅ **DEPLOYMENT_GUIDE.md** - Complete detailed guide
- ✅ **PRODUCTION_CHECKLIST.md** - Step-by-step checklist
- ✅ **scripts/deploy-production.ps1** - Automated deployment script

---

## Need Help?

1. Read **QUICK_DEPLOY.md** first
2. Use **PRODUCTION_CHECKLIST.md** to track progress
3. Check **DEPLOYMENT_GUIDE.md** for troubleshooting

**Let's get you deployed! 🚀**

