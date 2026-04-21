import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export function normalizeEmailForMatch(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase()
}

export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone || '').replace(/\D/g, '')
}

function isPlaceholderJotformEmail(email: string | null | undefined): boolean {
  const e = (email || '').toLowerCase()
  return e.endsWith('@jotform.local')
}

/**
 * Move related rows from duplicate contacts into `targetId`, then delete duplicates.
 */
export async function mergeContactsIntoTarget(
  targetId: string,
  sourceIds: string[],
  tx?: Prisma.TransactionClient
): Promise<void> {
  const uniqueSources = Array.from(new Set(sourceIds)).filter((id) => id && id !== targetId)
  if (uniqueSources.length === 0) return

  const run = async (db: Prisma.TransactionClient) => {
    await db.policy.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.task.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.file.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.emailLog.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.smsLog.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.contactTag.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.campaignContact.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.jotformSyncedSubmission.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.auditLog.updateMany({
      where: { contactId: { in: uniqueSources } },
      data: { contactId: targetId },
    })
    await db.referralConversion.updateMany({
      where: { newContactId: { in: uniqueSources } },
      data: { newContactId: targetId },
    })

    const targetSd = await db.sensitiveData.findUnique({ where: { contactId: targetId } })
    const sourceSds = await db.sensitiveData.findMany({
      where: { contactId: { in: uniqueSources } },
    })
    let hasTargetSd = Boolean(targetSd)
    for (const sd of sourceSds) {
      if (!hasTargetSd) {
        await db.sensitiveData.update({
          where: { id: sd.id },
          data: { contactId: targetId },
        })
        hasTargetSd = true
      } else {
        await db.sensitiveData.delete({ where: { id: sd.id } }).catch(() => {})
      }
    }

    await db.referralLink.updateMany({ where: { contactId: { in: uniqueSources } }, data: { contactId: targetId } }).catch(
      () => {}
    )

    await db.contact.deleteMany({ where: { id: { in: uniqueSources } } })
  }

  if (tx) {
    await run(tx)
  } else {
    await prisma.$transaction(async (inner) => run(inner))
  }
}

export type IdentityForMerge = {
  email?: string | null
  mobilePhone?: string | null
}

/**
 * Find other contact ids that look like the same person (email case-insensitive or same phone digits).
 */
export async function findDuplicateContactIds(
  primaryId: string,
  identity: IdentityForMerge
): Promise<string[]> {
  const em = normalizeEmailForMatch(identity.email)
  const phoneDigits = normalizePhoneDigits(identity.mobilePhone)
  if (!em && phoneDigits.length < 7) return []

  const or: Prisma.ContactWhereInput[] = []
  if (em && !isPlaceholderJotformEmail(identity.email)) {
    or.push({ email: { equals: em, mode: 'insensitive' } })
  }
  if (identity.mobilePhone?.trim()) {
    or.push({ mobilePhone: identity.mobilePhone.trim() })
  }

  if (or.length === 0) return []

  const candidates = await prisma.contact.findMany({
    where: {
      id: { not: primaryId },
      OR: or,
    },
    select: { id: true, email: true, mobilePhone: true },
  })

  return candidates
    .filter((c) => {
      if (em && !isPlaceholderJotformEmail(identity.email)) {
        if (normalizeEmailForMatch(c.email) === em) return true
      }
      if (phoneDigits.length >= 7) {
        const cd = normalizePhoneDigits(c.mobilePhone)
        if (cd && cd === phoneDigits) return true
      }
      return false
    })
    .map((c) => c.id)
}

/**
 * Merge all duplicate rows into the primary contact after intake/JotForm.
 */
export async function mergeIntakeDuplicates(primaryId: string, identity: IdentityForMerge): Promise<number> {
  const dupes = await findDuplicateContactIds(primaryId, identity)
  if (dupes.length === 0) return 0
  await mergeContactsIntoTarget(primaryId, dupes)
  return dupes.length
}
