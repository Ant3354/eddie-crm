/**
 * One-shot JotForm inbox → CRM sync (same logic as cron / “Sync inbox now”).
 * Loads .env / .env.local like Next.js. Requires JOTFORM_API_KEY and DATABASE_URL.
 *
 * Usage: npx tsx scripts/run-jotform-inbox-sync-once.ts
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function main() {
  const { syncJotformInbox } = await import('../lib/jotform-inbox-sync')
  const result = await syncJotformInbox()
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
