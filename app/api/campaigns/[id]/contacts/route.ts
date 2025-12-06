import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { contactIds } = body

    if (!contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json(
        { error: 'contactIds array is required' },
        { status: 400 }
      )
    }

    // Add contacts to campaign
    const campaignContacts = await Promise.all(
      contactIds.map((contactId: string) =>
        prisma.campaignContact.upsert({
          where: {
            campaignId_contactId: {
              campaignId: params.id,
              contactId,
            },
          },
          create: {
            campaignId: params.id,
            contactId,
            status: 'ACTIVE',
            currentStep: 0,
          },
          update: {
            status: 'ACTIVE',
          },
        })
      )
    )

    return NextResponse.json({ success: true, campaignContacts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

