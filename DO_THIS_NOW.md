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
- Value: Your Neon (or other Postgres) connection string from the provider dashboard — **never commit this to git.**
- Select: Production AND Preview (and Development if you use `vercel env pull`)

**Variable 2:**
- Name: `JWT_SECRET`
- Value: A long random string (generate locally, e.g. `openssl rand -hex 32`)
- Select: Production AND Preview

**Variable 3:**
- Name: `CRON_SECRET`
- Value: A UUID or random string for `Authorization: Bearer …` on cron routes
- Select: Production AND Preview

**Variable 4:**
- Name: `NEXT_PUBLIC_APP_URL`
- Value: Your live site URL, e.g. `https://eddie-crm-khaki.vercel.app`
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

Vercel **Hobby** only allows **one run per day** per scheduled cron. Campaigns stay on the daily schedule in `vercel.json`.

**JotForm inbox sync every 30 minutes:** this repo includes **`.github/workflows/jotform-sync-cron.yml`**. Add GitHub Actions secrets `EDDIE_CRM_BASE_URL` (your live site URL, no trailing slash) and `CRON_SECRET` (same value as `CRON_SECRET` on Vercel). The workflow POSTs to `/api/cron/jotform-sync` with `Authorization: Bearer …`.

## 🔐 Rotate Neon database password (do in Neon console)

1. Open [Neon Console](https://console.neon.tech) → your project → **Roles** (or **Reset password** for the DB role).
2. Generate a new password and copy the **new** connection string (`DATABASE_URL`).
3. Update **Vercel** → Project → Environment Variables → `DATABASE_URL` (Production, Preview, Development) → **Save** → **Redeploy**.
4. Update local **`.env`** and **`.env.local`** (or run `vercel env pull .env.local` after Vercel is updated), then run `npx prisma db push` if the schema changed.

For more frequent **campaign** processing only, see `VERCEL_CRON_FIX.md`.

---

## 📝 After Deployment:

Update JotForm webhook:
1. Go to: https://form.jotform.com/253266939811163
2. Settings → Integrations → Webhooks
3. Update to: `https://your-url.vercel.app/api/webhooks/jotform`

---

**That's it! I've done everything else! 🚀**

