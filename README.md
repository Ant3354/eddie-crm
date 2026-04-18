# EDDIE CRM

A comprehensive CRM system for managing contacts, policies, campaigns, and automated workflows.

## Features

- **Contact Management**: Full contact profiles with segmentation by category (Consumer, Partners, Prospects)
- **JotForm Integration**: Automatic contact creation from form submissions
- **QR Code Generation**: Track referral sources with QR codes
- **PDF Parsing**: Extract data from uploaded PDFs to create profiles
- **Automated Campaigns**: Referral drips, portal redirects, failed payment rescue
- **SMS & Email**: Integrated communication channels
- **Compliance**: Field-level permissions, encryption, audit logs

## Quick Start

See `QUICKSTART.md` for a 5-minute setup guide.

## Quick Deploy (Free)

Recommended: Vercel (app) + Neon (Postgres)

### 1) Create a Neon Postgres (free)
- neon.tech → Create Project → copy your connection string (DATABASE_URL)

### 2) Prepare env vars
- Copy `env.example` to `.env` locally if you want to test
- Required for cloud: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`
- Optional: `SUPPORT_PHONE`, `SUPPORT_EMAIL`, `SUPPORT_CHAT_URL`, SMTP_*, TWILIO_*

### 3) Push schema to Neon
```
# Ensure DATABASE_URL points to your Neon DB
npx prisma generate
npx prisma db push
```

### 4) Deploy to Vercel
- vercel.com → New Project → Import this repo
- Add Environment Variables (Preview & Production):
  - DATABASE_URL = your Neon URL
  - NEXT_PUBLIC_APP_URL = https://your-app.vercel.app (update after first deploy)
  - CRON_SECRET = any random string
  - (Optional) SMTP_* and TWILIO_* if you want real sends
- Deploy → copy the live URL
- Update NEXT_PUBLIC_APP_URL to your live URL and redeploy

Alternatively run the helper script (Windows):
```
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -AppUrl "https://your-app.vercel.app" -DatabaseUrl "postgres://..." -CronSecret "<uuid>"
```

### 5) Cron for campaigns
- vercel.json includes an hourly cron to call `/api/cron/process-campaigns`
- Ensure CRON_SECRET is set in Vercel env

### 6) Verify
- Open `/test` → run both Basic and All Requirements tests
- Toggle dark mode (navbar)
- Navigate: Dashboard, Contacts, Campaigns, Tasks, Templates, Pipeline
- Quick checks:
  - Contacts: select multiple → Add Tag → Export IDs
  - Pipeline: drag cards across stages
  - Tasks: change status dropdown; Export ICS
  - Templates: create/edit; ensure it saves
  - Integrations: copy webhook URLs

## Local Development
```
npm install
npx prisma generate
npx prisma db push
npm run dev
```
- Default dev port: 3001 (http://localhost:3001)

## Windows desktop app (installer)

The repo can produce a **Windows NSIS installer** that bundles the Next.js **standalone** server and starts it in the background when you open **Eddie CRM** (Electron shell).

1. Install dependencies: `npm install`
2. Ensure `.env` has a valid `DATABASE_URL` (Postgres) and `JWT_SECRET` — same as normal local run.
3. Build the app and installer:
   ```bash
   npm run build:desktop
   ```
4. Output: `release/Eddie CRM-Setup-1.0.0.exe` (run the installer on any Windows PC).

**First run after install:** A `.env` file is created under `%APPDATA%\eddie-crm\`. Edit `DATABASE_URL` and `JWT_SECRET` there, save, then launch **Eddie CRM** again.

**Optional — use a pre-downloaded Electron folder (faster / offline NSIS build):** extract the official `electron-v28.3.3-win32-x64` zip so it contains `electron.exe`, or set:

```powershell
$env:ELECTRON_DIST = "C:\path\to\electron-v28.3.3-win32-x64"
npm run build:desktop
```

The build script uses `electron-builder.config.cjs`, which checks `ELECTRON_DIST`, then `C:\Users\antho\Downloads\electron-v28.3.3-win32-x64`, then `node_modules\electron\dist` for `electron.exe`.

If packaging fails with **symbolic link / winCodeSign** errors, the project sets `forceCodeSigning: false` in `package.json` under `build` so a normal user account can build. (Alternatively: enable **Windows Developer Mode** or run the terminal as Administrator.)

**Offline / LAN dental QR:** On **QR Codes**, choose **Offline / LAN — built-in dental intake** so the QR does not depend on JotForm or a public domain. Set `NEXT_PUBLIC_APP_URL` to your PC’s LAN IP (for phones on the same Wi‑Fi). JotForm mode still needs the internet.

## Notes
- Email/SMS run in test mode without credentials (logged to DB)
- Use managed Postgres for production; avoid SQLite in cloud
- Set NEXT_PUBLIC_APP_URL correctly for links and templates

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run setup script (creates .env automatically):
```bash
npm run setup
# Then edit .env with your actual credentials (email, SMS, etc.)
```

3. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

4. (Optional) Seed the database:
```bash
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Database Management

- View database: `npm run db:studio`
- Reset database: Delete `prisma/dev.db` and run `npx prisma db push`

## Project Structure

```
├── app/              # Next.js app directory
│   ├── api/          # API routes
│   ├── contacts/     # Contact pages
│   ├── campaigns/    # Campaign pages
│   └── dashboard/    # Dashboard
├── components/       # React components
├── lib/             # Utilities and helpers
├── prisma/          # Database schema and migrations
└── public/          # Static assets
```

## Key Integrations

- **JotForm**: Webhook endpoint at `/api/webhooks/jotform`
- **Twilio**: SMS sending (configure in .env)
- **Nodemailer**: Email sending (configure in .env)

## Security Notes

- SSN and DOB are encrypted at rest
- Field-level permissions enforced
- Audit logs track all sensitive data access
- Use strong encryption keys in production

## Documentation

- `QUICKSTART.md` - 5-minute setup guide
- `INSTALL.md` - Detailed installation instructions
- `SETUP.md` - Configuration and deployment guide
- `PROJECT_SUMMARY.md` - Complete feature overview

## License

Private - All rights reserved

