import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPortalRedirectEmailTemplate } from '@/lib/email'
import { sendTestEmail } from '@/lib/email-test'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactId } = body

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        policies: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!contact || !contact.email) {
      return NextResponse.json(
        { error: 'Contact not found or no email' },
        { status: 400 }
      )
    }

    const policy = contact.policies[0]

    const portalLinks = {
      memberPortal: policy?.memberPortalLink || undefined,
      providerLookup: policy?.pharmacyLink || undefined, // Adjust based on your setup
      pharmacy: policy?.pharmacyLink || undefined,
      riderBenefits: policy?.riderBenefitsLink || undefined,
      supportPhone: process.env.SUPPORT_PHONE,
      supportChat: process.env.SUPPORT_CHAT_URL,
      appointmentLink: `${process.env.NEXT_PUBLIC_APP_URL}/appointments?contact=${contactId}`,
    }

    const emailContent = getPortalRedirectEmailTemplate(
      `${contact.firstName} ${contact.lastName}`,
      portalLinks
    )

    await sendTestEmail(
      contact.email,
      'Your Member Portal Access',
      emailContent,
      contactId
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

