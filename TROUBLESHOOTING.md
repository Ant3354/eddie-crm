# Troubleshooting Guide

## Common Issues & Solutions

### Issue: "Cannot find module './329.js'" or Similar Webpack Errors

**Cause**: Corrupted Next.js build cache

**Solution**:
```bash
# Stop the server (Ctrl+C)

# Delete build cache
Remove-Item -Recurse -Force .next

# Delete node_modules cache (if exists)
Remove-Item -Recurse -Force node_modules\.cache

# Rebuild
npm run build

# Restart server
npm run dev
```

**Or use the quick fix script**:
```bash
npm run clean-build
```

### Issue: Port 3000 Already in Use

**Solution**:
```bash
# Option 1: Use different port
npm run dev -- -p 3001

# Option 2: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Database Errors

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: Deletes all data)
Remove-Item prisma\dev.db
npx prisma db push

# Or just push schema changes
npx prisma db push
```

### Issue: Module Not Found Errors

**Solution**:
```bash
# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Issue: TypeScript Errors

**Solution**:
```bash
# Regenerate Prisma client (often fixes type errors)
npx prisma generate

# Check for missing types
npm install --save-dev @types/node @types/react @types/react-dom
```

### Issue: Environment Variables Not Loading

**Solution**:
1. Check `.env` file exists
2. Restart the dev server after changing `.env`
3. Verify variable names match exactly (case-sensitive)
4. No spaces around `=` in `.env` file

### Issue: Email/SMS Not Sending

**Solution**:
1. Check `.env` has correct credentials
2. For Gmail: Use App Password, not regular password
3. For Twilio: Verify account SID starts with "AC"
4. Check error logs in EmailLog/SmsLog tables

### Issue: PDF Parsing Not Working

**Solution**:
1. Ensure `uploads/` directory exists and is writable
2. Check file size (should be < 10MB)
3. Verify PDF is not password-protected
4. Check parseResult in File table for error messages

### Issue: Referral Links Not Working

**Solution**:
1. Ensure `NEXT_PUBLIC_APP_URL` is set in `.env`
2. Check referral link exists in database
3. Verify referral code format is correct
4. Check browser console for errors

## Quick Fixes

### Complete Reset (Nuclear Option)
```bash
# Stop server
# Delete everything
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
Remove-Item prisma\dev.db

# Reinstall
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Clean Build Script
Add to `package.json`:
```json
"scripts": {
  "clean-build": "Remove-Item -Recurse -Force .next; npm run build"
}
```

## Still Having Issues?

1. Check server terminal for error messages
2. Check browser console (F12) for client errors
3. Verify Node.js version: `node --version` (should be 18+)
4. Verify all dependencies installed: `npm list --depth=0`
5. Check `.env` file exists and has required variables

