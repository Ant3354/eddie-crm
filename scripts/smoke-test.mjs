/**
 * HTTP smoke test — run while dev or start server is up (default port 3001).
 * Usage: node scripts/smoke-test.mjs
 * Env: SMOKE_BASE=http://127.0.0.1:3001
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const BASE = (process.env.SMOKE_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '')

const PAGE_PATHS = [
  '/',
  '/dashboard',
  '/contacts',
  '/contacts/new',
  '/contacts/merge',
  '/contacts/import',
  '/campaigns',
  '/campaigns/new',
  '/tasks',
  '/qrcodes',
  '/integrations',
  '/pipeline',
  '/templates',
  '/templates/new',
  '/test',
  '/intake',
]

const API_PATHS = [
  '/api/public/config',
  '/api/contacts',
  '/api/campaigns',
  '/api/tasks',
  '/api/analytics',
  '/api/notifications',
  '/api/policies',
  '/api/qrcodes',
  '/api/qrcodes/stats',
  '/api/referrals/stats',
  '/api/campaigns/process',
  '/api/cron/process-campaigns',
  '/api/test',
  '/api/test-all-features',
  '/api/test-fixes',
]

async function checkPage(url) {
  const res = await fetch(url, { redirect: 'manual' })
  const text = await res.text()
  const hasNext =
    text.includes('__NEXT_DATA__') ||
    text.includes('/_next/static') ||
    text.includes('EDDIE CRM') ||
    text.includes('<!DOCTYPE html>')
  return {
    url,
    ok: res.status >= 200 && res.status < 400,
    status: res.status,
    hasNext,
    bytes: text.length,
  }
}

async function checkApi(url) {
  const res = await fetch(url)
  let jsonOk = false
  try {
    await res.clone().json()
    jsonOk = true
  } catch {
    jsonOk = false
  }
  return {
    url,
    ok: res.ok,
    status: res.status,
    jsonOk,
  }
}

const report = {
  base: BASE,
  at: new Date().toISOString(),
  pages: [],
  apis: [],
  failed: [],
}

console.log('Smoke test against', BASE)

for (const p of PAGE_PATHS) {
  const url = BASE + p
  try {
    const r = await checkPage(url)
    report.pages.push(r)
    const pass = r.ok && r.hasNext && r.bytes > 500
    if (!pass) report.failed.push({ type: 'page', ...r, reason: !r.ok ? 'http' : !r.hasNext ? 'no_next_markers' : 'small_body' })
    console.log(pass ? '  OK' : '  FAIL', p, r.status, r.bytes)
  } catch (e) {
    report.pages.push({ url, error: String(e.message) })
    report.failed.push({ type: 'page', url, error: String(e.message) })
    console.log('  FAIL', p, e.message)
  }
}

for (const p of API_PATHS) {
  const url = BASE + p
  try {
    const r = await checkApi(url)
    report.apis.push(r)
    if (!r.ok) report.failed.push({ type: 'api', ...r })
    console.log(r.ok ? '  OK' : '  FAIL', p, r.status)
  } catch (e) {
    report.apis.push({ url, error: String(e.message) })
    report.failed.push({ type: 'api', url, error: String(e.message) })
    console.log('  FAIL', p, e.message)
  }
}

report.summary = {
  pageFailures: report.pages.filter((x) => !x.ok || !x.hasNext || x.bytes < 500).length,
  apiFailures: report.apis.filter((x) => !x.ok).length,
  totalFailed: report.failed.length,
}

const outPath = path.join(root, 'smoke-test-report.json')
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
console.log('\nWrote', outPath)
console.log('Summary:', report.summary)

if (report.failed.length) {
  console.error('\nFailures:', JSON.stringify(report.failed, null, 2))
  process.exit(1)
}

process.exit(0)
