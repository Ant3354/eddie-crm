# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Node.js
If you don't have Node.js installed:
- Download from: https://nodejs.org/ (version 18 or higher)
- Verify: Open terminal and run `node --version`

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment
```bash
npm run setup
```
This creates your `.env` file automatically.

### Step 4: Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### Step 5: Start the Server
```bash
npm run dev
```

### Step 6: Open in Browser
Navigate to: **http://localhost:3000**

## ✅ Test It Works

1. Go to **Contacts** → **New Contact**
2. Fill in the form and create a contact
3. You should see it in the contacts list
4. Click on the contact to view details

## 🔧 Configure Integrations (Optional)

### Email (for sending emails)
Edit `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SMS (for sending SMS)
Edit `.env`:
```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

### JotForm Webhook
1. Go to **Integrations** page in the app
2. Copy the webhook URL
3. Add it to your JotForm form settings

## 📖 Next Steps

- Read `INSTALL.md` for detailed installation
- Read `SETUP.md` for configuration details
- Read `PROJECT_SUMMARY.md` for feature overview

## 🆘 Troubleshooting

**"node is not recognized"**
→ Install Node.js and restart terminal

**"npm is not recognized"**
→ Node.js includes npm, restart terminal after installing Node.js

**Port 3000 in use**
→ Change port: `npm run dev -- -p 3001`

**Database errors**
→ Run: `npx prisma generate && npx prisma db push`

## 🎉 You're Ready!

The CRM is now running locally. All core features are available:
- ✅ Contact management
- ✅ PDF parsing
- ✅ QR code generation
- ✅ Campaign management
- ✅ Task tracking
- ✅ Dashboard

Configure email/SMS when ready to use those features.

