const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Generate encryption key if .env doesn't exist
const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file...')
  const encryptionKey = crypto.randomBytes(32).toString('hex')
  
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (for future auth)
JWT_SECRET="${crypto.randomBytes(32).toString('hex')}"

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@eddiecrm.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# JotForm
JOTFORM_API_KEY=your-jotform-api-key
JOTFORM_FORM_ID=your-form-id
JOTFORM_WEBHOOK_SECRET=your-webhook-secret

# Encryption Key (for SSN/DOB) - Auto-generated
ENCRYPTION_KEY=${encryptionKey}

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Support
SUPPORT_PHONE=+1234567890
SUPPORT_CHAT_URL=https://support.example.com
`
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ .env file created with auto-generated encryption key')
} else {
  console.log('✅ .env file already exists')
}

// Create necessary directories
const dirs = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'public', 'qrcodes'),
]

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✅ Created directory: ${dir}`)
  }
})

console.log('\n✅ Setup complete!')
console.log('\nNext steps:')
console.log('1. Edit .env file with your actual configuration')
console.log('2. Run: npm install')
console.log('3. Run: npx prisma generate')
console.log('4. Run: npx prisma db push')
console.log('5. (Optional) Run: npm run db:seed')
console.log('6. Run: npm run dev')

