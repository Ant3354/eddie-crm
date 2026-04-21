# 🚀 I'll Deploy This For You - Simple Steps

I've prepared everything. Just follow these 3 simple steps:

## ✅ What I've Already Done

- ✅ Database connected to Neon
- ✅ Schema pushed to database
- ✅ Admin user created (admin@eddiecrm.com / admin123)
- ✅ Prisma configured for PostgreSQL
- ✅ Secrets generated
- ✅ Vercel CLI installed

## 📋 What You Need to Do (5 minutes)

### Step 1: Login to Vercel (1 minute)

1. Open PowerShell in this folder
2. Run: `vercel login`
3. Press ENTER when it asks to open browser
4. Complete login in browser
5. Come back to PowerShell when it says "Success!"

### Step 2: Deploy (2 minutes)

After login, run this command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/auto-deploy.ps1
```

This will:
- Link your project
- Set all environment variables
- Deploy to Vercel
- Give you your live URL

### Step 3: Update JotForm (1 minute)

1. Copy your Vercel URL (from Step 2 output)
2. Go to: https://form.jotform.com/253266939811163
3. Settings → Integrations → Webhooks
4. Update URL to: `https://your-url.vercel.app/api/webhooks/jotform`
5. Save

## 🎉 Done!

Your CRM will be live at: `https://your-app.vercel.app`

---

## Alternative: Manual Vercel Dashboard (Even Easier!)

If you prefer using the web interface:

### 1. Go to Vercel
- Visit: https://vercel.com
- Sign up/Login with GitHub

### 2. Import Project
- Click "New Project"
- Import your GitHub repository
- Click "Import"

### 3. Add Environment Variables

Click "Environment Variables" and add these (for BOTH Production and Preview):

```
DATABASE_URL = <paste from Neon dashboard — do not commit>
```

```
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```
*(Update after first deploy)*

```
JWT_SECRET = <generate a long random string>
```

```
CRON_SECRET = <generate a UUID or random string>
```

### 4. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Copy your URL

### 5. Update App URL
- Go to Settings → Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your actual URL
- Redeploy

---

## Your Credentials

**Admin Login:**
- Email: `admin@eddiecrm.com`
- Password: `admin123`

**Database:**
- Already connected and ready!

**Secrets:** Store `JWT_SECRET` and `CRON_SECRET` only in Vercel (or a password manager), not in git.

---

## Need Help?

Just tell me which step you're on and I'll help you through it!

**Everything is ready - just need to deploy to Vercel! 🚀**

