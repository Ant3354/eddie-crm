# 🚀 Automated Installation Guide

I've created automated installation scripts for you! Here's how to use them:

## Option 1: PowerShell Script (Recommended for Windows)

1. **Right-click** on `install.ps1` in File Explorer
2. Select **"Run with PowerShell"**
3. OR open PowerShell in this folder and run:
   ```powershell
   .\install.ps1
   ```

If you get a security error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Option 2: Batch File (Simple Double-Click)

1. **Double-click** `install.bat`
2. The script will run automatically

## What the Scripts Do:

1. ✅ Check if Node.js is installed
2. ✅ If not, guide you to install it
3. ✅ Install all npm dependencies
4. ✅ Create `.env` file automatically
5. ✅ Generate Prisma database client
6. ✅ Initialize the database
7. ✅ Option to start the server immediately

## If Node.js is NOT Installed:

The script will:
- Show you an error message
- Open the Node.js download page
- Guide you through installation

**After installing Node.js:**
1. Close and reopen your terminal/PowerShell
2. Run the installation script again

## After Installation:

### Start the Server:

**Option A:** Use the batch file
- Double-click `START_SERVER.bat`

**Option B:** Use command line
```bash
npm run dev
```

### Access the Application:

Open your browser and go to: **http://localhost:3000**

## Troubleshooting:

### "Execution Policy" Error (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script Won't Run
- Make sure you're in the project folder
- Try running from Command Prompt instead: `install.bat`

### Node.js Still Not Found
- Restart your computer after installing Node.js
- Or manually add Node.js to your PATH

## Manual Installation (If Scripts Don't Work):

1. Install Node.js: https://nodejs.org/
2. Restart terminal
3. Run these commands:
   ```bash
   npm install
   npm run setup
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

## Quick Start After Installation:

1. ✅ Installation complete
2. ✅ Server running at http://localhost:3000
3. ✅ Create your first contact
4. ✅ Test PDF upload
5. ✅ Generate QR codes
6. ✅ Configure email/SMS (optional)

---

**Need Help?** Check `STATUS_CHECK.md` for detailed status information.

