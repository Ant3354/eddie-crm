import { prisma } from './prisma'
import crypto from 'crypto'

export interface ReferralLinkData {
  contactId: string
  referralCode: string
  referralUrl: string
  clickCount: number
  conversionCount: number
  createdAt: Date
}

export async function generateReferralLink(contactId: string): Promise<string> {
  // Check if referral link already exists
  const existingLink = await prisma.referralLink.findUnique({
    where: { contactId },
  })

  if (existingLink) {
    return existingLink.referralUrl
  }

  // Also check tag (for backwards compatibility)
  const existingTag = await prisma.contactTag.findFirst({
    where: {
      contactId,
      name: {
        startsWith: 'Referral Code:',
      },
    },
  })

  if (existingTag) {
    const code = existingTag.name.replace('Referral Code: ', '')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/referral/${code}`
  }

  // Generate unique referral code
  const referralCode = crypto.randomBytes(8).toString('hex').toUpperCase()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const referralUrl = `${baseUrl}/referral/${referralCode}`

  // Store referral code as tag
  await prisma.contactTag.create({
    data: {
      contactId,
      name: `Referral Code: ${referralCode}`,
    },
  })

  // Create referral tracking record
  await prisma.referralLink.create({
    data: {
      contactId,
      referralCode,
      referralUrl,
      clickCount: 0,
      conversionCount: 0,
    },
  })

  return referralUrl
}

export async function getReferralLink(contactId: string): Promise<string | null> {
  const tag = await prisma.contactTag.findFirst({
    where: {
      contactId,
      name: {
        startsWith: 'Referral Code:',
      },
    },
  })

  if (!tag) {
    return await generateReferralLink(contactId)
  }

  const code = tag.name.replace('Referral Code: ', '')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/referral/${code}`
}

export async function trackReferralClick(referralCode: string, source?: string) {
  const referral = await prisma.referralLink.findUnique({
    where: { referralCode },
  })

  if (referral) {
    await prisma.referralLink.update({
      where: { referralCode },
      data: {
        clickCount: {
          increment: 1,
        },
        lastClickedAt: new Date(),
      },
    })

    // Log the click
    await prisma.referralClick.create({
      data: {
        referralLinkId: referral.id,
        source: source || 'unknown',
        clickedAt: new Date(),
      },
    })
  }
}

export async function trackReferralConversion(referralCode: string, newContactId: string) {
  const referral = await prisma.referralLink.findUnique({
    where: { referralCode },
  })

  if (referral) {
    await prisma.referralLink.update({
      where: { referralCode },
      data: {
        conversionCount: {
          increment: 1,
        },
        lastConvertedAt: new Date(),
      },
    })

    // Tag the new contact with referral source
    await prisma.contactTag.create({
      data: {
        contactId: newContactId,
        name: `Referred By: ${referral.contactId}`,
      },
    })

    // Log the conversion
    await prisma.referralConversion.create({
      data: {
        referralLinkId: referral.id,
        newContactId,
        convertedAt: new Date(),
      },
    })
  }
}

export async function getReferralStats(contactId: string) {
  const referral = await prisma.referralLink.findFirst({
    where: { contactId },
    include: {
      clicks: {
        orderBy: {
          clickedAt: 'desc',
        },
        take: 10,
      },
      conversions: {
        include: {
          newContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          convertedAt: 'desc',
        },
      },
    },
  })

  if (!referral) {
    return null
  }

  return {
    referralCode: referral.referralCode,
    referralUrl: referral.referralUrl,
    clickCount: referral.clickCount,
    conversionCount: referral.conversionCount,
    conversionRate: referral.clickCount > 0 
      ? (referral.conversionCount / referral.clickCount * 100).toFixed(2) 
      : '0.00',
    clicks: referral.clicks,
    conversions: referral.conversions,
  }
}

