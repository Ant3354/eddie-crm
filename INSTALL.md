# EDDIE CRM Installation Guide

## Prerequisites

Before installing, make sure you have:

1. **Node.js 18+** installed
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## Installation Steps

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Next.js (React framework)
- Prisma (Database ORM)
- TypeScript
- Tailwind CSS
- PDF parsing libraries
- QR code generation
- Email and SMS libraries

### 2. Run Setup Script

```bash
npm run setup
```

This creates:
- `.env` file with auto-generated encryption key
- Required directories (`uploads/`, `public/qrcodes/`)

### 3. Configure Environment Variables

Edit the `.env` file with your actual credentials:

**Required for basic functionality:**
- `ENCRYPTION_KEY` - Already auto-generated (keep this!)
- `DATABASE_URL` - Already set for SQLite (keep this!)

**For Email (Nodemailer):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password for Gmail
SMTP_FROM=noreply@yourdomain.com
```

**For SMS (Twilio):**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890  # Must include country code
```

**Optional:**
```env
SUPPORT_PHONE=+1234567890
SUPPORT_CHAT_URL=https://support.yourdomain.com
```

### 4. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

This creates the SQLite database and generates Prisma client.

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

This creates sample campaigns and data.

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## Quick Test

1. Open http://localhost:3000
2. Click "Contacts" → "New Contact"
3. Create a test contact
4. Verify it appears in the contacts list

## Troubleshooting

### "node is not recognized"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation
- Verify with `node --version`

### "npm is not recognized"
- Node.js installation includes npm
- Restart terminal after Node.js installation
- Verify with `npm --version`

### Database errors
- Make sure you ran `npx prisma generate` and `npx prisma db push`
- Check that `DATABASE_URL` in `.env` is correct
- Try deleting `prisma/dev.db` and running `npx prisma db push` again

### Port 3000 already in use
- Change port: `npm run dev -- -p 3001`
- Or stop the process using port 3000

### Module not found errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

## Next Steps

1. **Configure JotForm Webhook:**
   - See Integrations page in the app
   - Use ngrok for local testing: `ngrok http 3000`

2. **Set up Email/SMS:**
   - Configure SMTP settings for emails
   - Set up Twilio account for SMS

3. **Set up Campaign Processing:**
   - Configure a cron job to call `/api/campaigns/process` periodically
   - Or use a service like EasyCron

4. **Test Features:**
   - Create contacts
   - Upload PDFs
   - Generate QR codes
   - Create campaigns

## Production Deployment

See `SETUP.md` for production deployment instructions.

## Support

If you encounter issues:
1. Check the error messages in the terminal
2. Review `SETUP.md` for detailed configuration
3. Check that all environment variables are set correctly
4. Verify Node.js version is 18+

