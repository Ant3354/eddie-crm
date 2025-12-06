# EDDIE CRM Setup Guide

## Quick Start

1. **Run setup script** (creates .env and directories):
```bash
npm run setup
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
Edit `.env` file with your actual credentials:
- SMTP settings (for emails)
- Twilio credentials (for SMS)
- JotForm webhook URL (will be shown in Integrations page)

4. **Initialize database**:
```bash
npx prisma generate
npx prisma db push
```

5. **Seed database (optional)**:
```bash
npm run db:seed
```

6. **Start development server**:
```bash
npm run dev
```

7. **Open browser**:
Navigate to http://localhost:3000

## Environment Variables

### Required for Basic Functionality
- `DATABASE_URL` - SQLite database path (auto-configured)
- `ENCRYPTION_KEY` - Auto-generated 32-character key for SSN/DOB encryption

### Required for Email
- `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (usually 587)
- `SMTP_USER` - Your email address
- `SMTP_PASS` - Your email password or app password
- `SMTP_FROM` - From email address

### Required for SMS
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number (format: +1234567890)

### Optional
- `JOTFORM_API_KEY` - For advanced JotForm integration
- `JOTFORM_FORM_ID` - Your JotForm form ID
- `SUPPORT_PHONE` - Support phone number for portal emails
- `SUPPORT_CHAT_URL` - Support chat URL for portal emails

## JotForm Webhook Setup

1. Go to your JotForm form settings
2. Navigate to Integrations → Webhooks
3. Add new webhook with URL: `http://your-domain.com/api/webhooks/jotform`
4. For local testing, use a service like ngrok: `ngrok http 3000`
5. Map your form fields to these expected names:
   - `firstName` / `lastName`
   - `email`
   - `phone` / `mobilePhone`
   - `address`
   - `language` / `languagePreference`
   - `interestType` / `category`
   - `appointmentTime` / `preferredAppointmentTime`

## Campaign Processing

Campaigns need to be processed periodically. Set up a cron job or scheduled task to call:
```
POST /api/campaigns/process
```

For local development, you can use a tool like:
- Windows Task Scheduler
- macOS launchd
- Linux cron
- Or use a service like EasyCron

Recommended frequency: Every hour

## Database Management

- **View database**: `npm run db:studio`
- **Reset database**: Delete `prisma/dev.db` and run `npx prisma db push`
- **Create migration**: `npx prisma migrate dev --name migration_name`

## Production Deployment

1. **Switch to PostgreSQL** (recommended for production):
   - Update `DATABASE_URL` in `.env` to PostgreSQL connection string
   - Update `prisma/schema.prisma` datasource to `postgresql`
   - Run `npx prisma db push`

2. **Set secure environment variables**:
   - Use strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`
   - Never commit `.env` to version control

3. **Enable HTTPS**:
   - Required for webhooks and secure data transmission

4. **Set up file storage**:
   - For production, use cloud storage (S3, etc.) instead of local `uploads/` directory
   - Update file upload paths in API routes

5. **Configure email/SMS**:
   - Use production SMTP/SMS credentials
   - Test email and SMS delivery

## Troubleshooting

### Database errors
- Make sure `prisma generate` was run
- Check that `DATABASE_URL` is correct
- Try deleting `prisma/dev.db` and running `npx prisma db push` again

### Email not sending
- Verify SMTP credentials in `.env`
- Check firewall/network settings
- For Gmail, use an "App Password" instead of regular password

### SMS not sending
- Verify Twilio credentials
- Check that phone numbers are in E.164 format (+1234567890)
- Ensure Twilio account has sufficient credits

### PDF parsing not working
- Ensure PDF files are not password-protected
- Check that `uploads/` directory has write permissions
- Verify file size limits in `next.config.js`

## Support

For issues or questions, check the codebase documentation or contact support.

