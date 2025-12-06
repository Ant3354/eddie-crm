# Quick Fix for Server Not Loading

## If the webpage is not loading:

### Step 1: Check if Server is Running
Look for a PowerShell window that says "Starting EDDIE CRM Server..." or check if you see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### Step 2: If Server is NOT Running

**Option A: Start Manually**
1. Open PowerShell in the project folder
2. Run: `npm run dev`
3. Wait for "Ready" message
4. Open http://localhost:3000

**Option B: Use the Batch File**
1. Double-click `START_SERVER.bat`
2. Wait for server to start
3. Open http://localhost:3000

### Step 3: If Server IS Running But Page Won't Load

**Clear Cache and Restart:**
```bash
# Stop server (Ctrl+C)
npm run clean
npm run dev
```

### Step 4: Check for Errors

Look at the terminal/PowerShell window running `npm run dev` for:
- Compilation errors
- Port already in use
- Database connection errors
- Missing environment variables

### Common Issues:

**"Port 3000 already in use"**
```bash
# Use different port
npm run dev -- -p 3001
# Then go to http://localhost:3001
```

**"Cannot find module" errors**
```bash
npm install
npm run dev
```

**Database errors**
```bash
npx prisma generate
npx prisma db push
npm run dev
```

### Step 5: Nuclear Option (Full Reset)

If nothing works:
```bash
# Stop server
# Delete everything
npm run clean
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstall
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## What to Look For:

✅ **Good Signs:**
- Terminal shows "Ready" message
- No red error messages
- Port 3000 is listening

❌ **Bad Signs:**
- Red error messages in terminal
- "Port already in use"
- "Cannot find module"
- Database connection errors

## Still Not Working?

1. **Copy the exact error message** from the terminal
2. **Check browser console** (F12) for errors
3. **Verify Node.js is working**: `node --version`
4. **Check .env file exists** and has DATABASE_URL

---

**Most Common Fix**: Just run `npm run clean && npm run dev` in a fresh terminal window.

