# 🚀 DO THIS NOW - Your Website Will Be Live in 5 Minutes!

I've done 99% of the work. You just need to click a few buttons.

## ⚡ FASTEST WAY (3 Steps):

### 1. Go to Vercel
**Click:** https://vercel.com/new

### 2. Import Your Code
- Sign up/Login (use GitHub)
- Click "New Project"
- Click "Import Git Repository"
- **If you don't have GitHub yet:**
  - Go to https://github.com/new
  - Create a repository called "eddie-crm"
  - Upload all your files
  - Come back to Vercel

### 3. Add These 4 Environment Variables

Click "Environment Variables" and add:

**Variable 1:**
- Name: `DATABASE_URL`
- Value: `postgresql://neondb_owner:npg_K8yGqg0PrOQw@ep-proud-feather-ah5r6q3c-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- Select: Production AND Preview

**Variable 2:**
- Name: `JWT_SECRET`
- Value: `0jQEi74YZghFGOqHRUbXVKBotpADWfCs`
- Select: Production AND Preview

**Variable 3:**
- Name: `CRON_SECRET`
- Value: `9c184a08-daba-43cb-9710-3ab9249ec9cb`
- Select: Production AND Preview

**Variable 4:**
- Name: `NEXT_PUBLIC_APP_URL`
- Value: `https://your-app.vercel.app` (you'll update this after deploy)
- Select: Production AND Preview

### 4. Deploy!
- Click "Deploy"
- Wait 2 minutes
- **COPY YOUR URL!** (e.g., `https://eddie-crm-abc123.vercel.app`)

### 5. Update App URL
- Go to Settings → Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your actual URL
- Redeploy

---

## 🎉 DONE! Your Website is Live!

**Your URL will be:** `https://your-app-name.vercel.app`

**Login:**
- Email: `admin@eddiecrm.com`
- Password: `admin123`

---

## ⚠️ Important: Cron Job Configuration

The cron job is set to run **once per day at 9 AM UTC** (Vercel Hobby plan limit).

If you need more frequent campaign processing:
- **Option 1**: Upgrade to Vercel Pro
- **Option 2**: Use a free external cron service (see `VERCEL_CRON_FIX.md`)
- **Option 3**: Manually trigger via `/api/campaigns/process`

See `VERCEL_CRON_FIX.md` for details.

---

## 📝 After Deployment:

Update JotForm webhook:
1. Go to: https://form.jotform.com/253266939811163
2. Settings → Integrations → Webhooks
3. Update to: `https://your-url.vercel.app/api/webhooks/jotform`

---

**That's it! I've done everything else! 🚀**

