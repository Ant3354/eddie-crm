import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Endpoint to view webhook logs (last 50 submissions)
export async function GET() {
  try {
    // Get recent contacts created via JotForm (last 50)
    const recentContacts = await prisma.contact.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          where: {
            name: { startsWith: 'Referral Source:' }
          },
          take: 1
        }
      },
    })

    return NextResponse.json({
      success: true,
      totalContacts: recentContacts.length,
      contacts: recentContacts.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.mobilePhone,
        address: c.address,
        source: c.tags[0]?.name?.replace('Referral Source: ', '') || 'Unknown',
        category: c.category,
        status: c.status,
        createdAt: c.createdAt,
      })),
      message: 'Recent webhook submissions',
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: 'Error fetching webhook logs'
      },
      { status: 500 }
    )
  }
}

