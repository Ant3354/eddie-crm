/**
 * After `next build` with output: 'standalone', copy static assets into the
 * standalone folder so the production server can serve them.
 * @see https://nextjs.org/docs/app/api-reference/next-config-js/output
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const standalone = path.join(root, '.next', 'standalone')
const staticSrc = path.join(root, '.next', 'static')
const staticDest = path.join(standalone, '.next', 'static')
const publicSrc = path.join(root, 'public')
const publicDest = path.join(standalone, 'public')

if (!fs.existsSync(standalone)) {
  console.error('Missing .next/standalone. Run: npm run build')
  process.exit(1)
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('Skip copy (missing):', src)
    return
  }
  fs.mkdirSync(dest, { recursive: true })
  fs.cpSync(src, dest, { recursive: true })
  console.log('Copied', src, '->', dest)
}

copyDir(staticSrc, staticDest)
copyDir(publicSrc, publicDest)

const prismaSrc = path.join(root, 'prisma')
const prismaDest = path.join(standalone, 'prisma')
if (fs.existsSync(prismaSrc)) {
  copyDir(prismaSrc, prismaDest)
}

// Do not ship the developer's local SQLite file; create a fresh DB below.
const shippedDevDb = path.join(standalone, 'prisma', 'dev.db')
if (fs.existsSync(shippedDevDb)) {
  fs.unlinkSync(shippedDevDb)
}

// Ship a SQLite file next to the bundled schema so the packaged app runs on a clean PC.
const standaloneDb = path.join(standalone, 'prisma', 'dev.db')
const relToDb = path.relative(root, standaloneDb).split(path.sep).join('/')
const dbUrl = `file:./${relToDb}`
try {
  execSync(
    `npx prisma db push --skip-generate --schema "${path.join(root, 'prisma', 'schema.prisma')}"`,
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
    }
  )
} catch (e) {
  console.error('prisma db push (standalone dev.db) failed:', e.message)
  process.exit(1)
}

console.log('Standalone assets ready.')
