# Server Startup Guide

## Current Status

The server is **LISTENING on port 3001** but may still be compiling.

## Access URLs

- **Home:** http://localhost:3001/
- **Login:** http://localhost:3001/login
- **Register:** http://localhost:3001/register
- **Dashboard:** http://localhost:3001/dashboard

## Login Credentials

- **Email:** admin@eddiecrm.com
- **Password:** admin123

## If Server Won't Load

### Step 1: Wait for Compilation
Next.js dev server takes 30-60 seconds to compile on first start. Look for:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3001
✓ Ready in X seconds
```

### Step 2: Check Terminal
Look at the terminal running `npm run dev` for:
- ✅ "Ready" message = Server is ready
- ❌ Red errors = Fix errors first
- ⏳ "Compiling..." = Still compiling, wait

### Step 3: Force Restart
If stuck, restart:
```powershell
# Stop server (Ctrl+C in terminal)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean and restart
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

### Step 4: Check Browser
1. Open http://localhost:3001
2. If you see "This site can't be reached":
   - Wait 30 more seconds
   - Check terminal for "Ready" message
   - Try refreshing the page

## Verification

The server is running if:
- ✅ Port 3001 shows as LISTENING in `netstat`
- ✅ Terminal shows "Ready" message
- ✅ Browser can access http://localhost:3001

## Troubleshooting

**Port already in use:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Compilation errors:**
- Check terminal output
- Run `npm run build` to see full errors
- Fix errors and restart

**Database errors:**
```powershell
npx prisma generate
npx prisma db push
```

