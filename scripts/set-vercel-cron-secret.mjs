/**
 * Set CRON_SECRET on Vercel without trailing newline (shell pipes often add \\r\\n and break Vercel cron builds).
 * GitHub Actions: run `GITHUB_SYNC=1 node scripts/set-vercel-cron-secret.mjs` (same secret as Vercel).
 */
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'

const cron = crypto.randomUUID()
const root = process.cwd()
const stdin = Buffer.from(cron, 'utf8')

for (const env of ['production', 'preview']) {
  execSync(`vercel env add CRON_SECRET ${env} --force --sensitive`, {
    input: stdin,
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: root,
  })
}
execSync(`vercel env add CRON_SECRET development --force`, {
  input: stdin,
  stdio: ['pipe', 'inherit', 'inherit'],
  cwd: root,
})

if (process.env.GITHUB_SYNC === '1') {
  execSync(`gh secret set CRON_SECRET --body ${JSON.stringify(cron)}`, {
    stdio: 'inherit',
    cwd: root,
  })
}

console.log('CRON_SECRET updated on Vercel. GitHub sync:', process.env.GITHUB_SYNC === '1' ? 'yes' : 'skipped')
