import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const testContact = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'Contact',
        email: 'test@example.com',
        mobilePhone: '+1234567890',
        category: 'CONSUMER',
        status: 'ACTIVE_CLIENT',
        emailOptIn: true,
        smsOptIn: true,
        enrolledDate: new Date(),
      },
    })

    return NextResponse.json({ success: true, contact: testContact })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

