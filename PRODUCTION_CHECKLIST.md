# ✅ Production Deployment Checklist

Use this checklist to ensure everything is set up correctly for production.

## Pre-Deployment

- [ ] Code is committed to Git
- [ ] All tests pass locally
- [ ] Environment variables documented
- [ ] Database schema is final

## Database Setup

- [ ] Neon account created
- [ ] Neon project created
- [ ] Connection string copied
- [ ] Prisma schema updated to `postgresql`
- [ ] Schema pushed to Neon (`npx prisma db push`)
- [ ] Admin user created (`npm run create-admin`)
- [ ] Database connection tested

## Vercel Setup

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Build settings configured
- [ ] Environment variables added:
  - [ ] `DATABASE_URL` (Neon connection string)
  - [ ] `NEXT_PUBLIC_APP_URL` (Vercel URL)
  - [ ] `JWT_SECRET` (random 32+ chars)
  - [ ] `CRON_SECRET` (random UUID)
  - [ ] Optional: `SMTP_*` variables
  - [ ] Optional: `TWILIO_*` variables
- [ ] Variables added to BOTH Preview and Production
- [ ] First deployment successful
- [ ] `NEXT_PUBLIC_APP_URL` updated to actual URL
- [ ] Redeployed after URL update

## Post-Deployment

- [ ] App loads at production URL
- [ ] Login/Registration works
- [ ] Can create contacts
- [ ] Can generate QR codes
- [ ] Database is storing data (check Neon dashboard)
- [ ] JotForm webhook updated to production URL
- [ ] Test form submission works
- [ ] Contacts appear after form submission

## Security

- [ ] `JWT_SECRET` is strong and unique
- [ ] `CRON_SECRET` is set
- [ ] Database uses SSL (`?sslmode=require`)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] No sensitive data in code
- [ ] `.env` file not committed to Git

## Functionality Tests

- [ ] Contact CRUD operations
- [ ] QR code generation
- [ ] Form submission via webhook
- [ ] Dashboard loads correctly
- [ ] All pages accessible
- [ ] Dark mode works
- [ ] Responsive design works

## Optional Enhancements

- [ ] Custom domain configured
- [ ] Email sending configured (SMTP)
- [ ] SMS sending configured (Twilio)
- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] Backup strategy in place

## Monitoring

- [ ] Vercel deployment logs checked
- [ ] Neon database usage monitored
- [ ] Error logs reviewed
- [ ] Performance metrics checked

## Documentation

- [ ] Production URL documented
- [ ] Admin credentials secured
- [ ] Team access configured (if applicable)
- [ ] Support contacts updated

---

## Quick Commands

```bash
# Update schema for PostgreSQL
# Edit prisma/schema.prisma: change "sqlite" to "postgresql"

# Push to Neon
npx prisma generate
npx prisma db push

# Create admin
npm run create-admin email@example.com password "Admin Name"

# Deploy
vercel --prod
```

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

**Status:** Ready for production! 🚀

