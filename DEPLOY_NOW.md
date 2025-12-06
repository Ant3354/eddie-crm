# 🚀 Deploy Now - Step by Step

Follow these steps to deploy your CRM to production:

## Step 1: Create Neon Database (2 minutes)

1. Go to: https://neon.tech
2. Click "Sign Up" (free account)
3. Click "Create Project"
4. Name: `eddie-crm`
5. Select region (closest to you)
6. Click "Create Project"
7. **Copy the Connection String** (looks like: `postgres://user:password@host/dbname?sslmode=require`)
8. **SAVE THIS** - you'll need it!

---

## Step 2: Update Prisma for PostgreSQL (30 seconds)

1. Open: `prisma/schema.prisma`
2. Find line 9: `provider = "sqlite"`
3. Change to: `provider = "postgresql"`
4. Save the file

---

## Step 3: Push Schema to Neon (1 minute)

Open PowerShell in your project folder and run:

```powershell
# Replace with YOUR Neon connection string
$env:DATABASE_URL = "postgres://user:password@host/dbname?sslmode=require"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create admin user
npm run create-admin admin@yourdomain.com yourpassword "Admin User"
```

**Note:** Replace the connection string with your actual Neon connection string!

---

## Step 4: Deploy to Vercel (2 minutes)

### 4.1 Create Vercel Account
1. Go to: https://vercel.com
2. Click "Sign Up" (use GitHub)
3. Authorize Vercel

### 4.2 Import Project
1. Click "New Project"
2. Import your GitHub repository
3. Click "Import"

### 4.3 Configure Project
- Framework: Next.js (auto-detected)
- Root Directory: `./` (default)
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)

### 4.4 Add Environment Variables

Click "Environment Variables" and add:

**Required:**
```
DATABASE_URL = [paste your Neon connection string]
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
JWT_SECRET = [generate: use this command: -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})]
CRON_SECRET = [generate: use this: (New-Guid).ToString()]
```

**Important:** 
- Add to **BOTH** "Production" and "Preview"
- For `NEXT_PUBLIC_APP_URL`, use a placeholder first (we'll update after deploy)

### 4.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Copy your deployment URL (e.g., `https://eddie-crm-abc123.vercel.app`)

### 4.6 Update App URL
1. Go to Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update to your actual URL: `https://eddie-crm-abc123.vercel.app`
4. Save
5. Go to Deployments → Click "..." → Redeploy

---

## Step 5: Update JotForm Webhook (30 seconds)

1. Go to: https://form.jotform.com/253266939811163
2. Settings → Integrations → Webhooks
3. Update webhook URL to: `https://your-app.vercel.app/api/webhooks/jotform`
4. Save

---

## Step 6: Test Everything! (1 minute)

1. Visit: `https://your-app.vercel.app`
2. Click "Create one now" to register
3. Login with your credentials
4. Test creating a contact
5. Test generating a QR code
6. Submit a test form and verify it appears

---

## ✅ You're Live!

Your CRM is now deployed and accessible at:
**https://your-app.vercel.app**

---

## Troubleshooting

**Database connection fails:**
- Double-check your Neon connection string
- Make sure `?sslmode=require` is at the end
- Check Neon dashboard for connection status

**Build fails:**
- Check Vercel build logs
- Make sure all files are committed to Git
- Verify Node.js version (18+)

**Webhook not working:**
- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- Check JotForm webhook URL is correct
- Check Vercel function logs

---

## Need More Help?

- **Quick Guide:** See `QUICK_DEPLOY.md`
- **Detailed Guide:** See `DEPLOYMENT_GUIDE.md`
- **Checklist:** See `PRODUCTION_CHECKLIST.md`

**Good luck! 🚀**

