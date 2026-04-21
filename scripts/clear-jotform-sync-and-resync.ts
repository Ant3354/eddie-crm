/**
 * Clears JotForm sync dedupe rows so the next inbox import re-processes submissions
 * (same as webhook/sync ingest — applies current field coercion to contacts).
 *
 * Usage:
 *   npx tsx scripts/clear-jotform-sync-and-resync.ts
 *   npx tsx scripts/clear-jotform-sync-and-resync.ts --delete-linked-contacts
 *
 * --delete-linked-contacts: also DELETE every Contact that had a JotformSyncedSubmission
 * (destructive — removes those CRM contacts entirely, then sync recreates them).
 */
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const deleteLinked =
  process.argv.includes('--delete-linked-contacts') || process.argv.includes('--wipe-contacts')

async function main() {
  const { prisma } = await import('../lib/prisma')
  const { syncJotformInbox } = await import('../lib/jotform-inbox-sync')

  if (deleteLinked) {
    const links = await prisma.jotformSyncedSubmission.findMany({
      select: { contactId: true },
    })
    const contactIds = Array.from(new Set(links.map((l) => l.contactId)))
    if (contactIds.length) {
      const delContacts = await prisma.contact.deleteMany({
        where: { id: { in: contactIds } },
      })
      console.log(
        'Deleted contacts that had JotForm sync rows (submissions cascade-deleted):',
        delContacts.count
      )
    } else {
      console.log('No JotForm-linked contacts to delete.')
    }
  } else {
    const cleared = await prisma.jotformSyncedSubmission.deleteMany({})
    console.log('Cleared JotformSyncedSubmission rows (contacts kept; will re-merge on sync):', cleared.count)
  }

  const result = await syncJotformInbox()
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
