import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

/** Must match seeded campaign name (editable in DB / Campaigns UI). */
export const ACTIVE_CLIENT_REFERRAL_CAMPAIGN_NAME = 'Active Client Referral Appreciation'

/**
 * Second-stage referral sequence for individuals who are active clients.
 * Idempotent: skips if already enrolled or campaign missing.
 */
export async function maybeEnrollActiveClientReferralStage2(contactId: string): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, category: true, status: true },
  })
  if (!contact) return
  if (contact.category !== 'CONSUMER') return
  if (contact.status !== 'ACTIVE_CLIENT') return

  const campaign = await prisma.campaign.findFirst({
    where: { name: ACTIVE_CLIENT_REFERRAL_CAMPAIGN_NAME, isActive: true },
  })
  if (!campaign) return

  const existing = await prisma.campaignContact.findFirst({
    where: {
      contactId,
      campaignId: campaign.id,
      status: { in: ['PENDING', 'ACTIVE'] },
    },
  })
  if (existing) return

  await prisma.campaignContact.create({
    data: {
      campaignId: campaign.id,
      contactId,
      status: 'ACTIVE',
      currentStep: 0,
    },
  })
  await logAudit('ACTIVE_CLIENT_REFERRAL_ENROLLED', undefined, contactId, campaign.name)
}
