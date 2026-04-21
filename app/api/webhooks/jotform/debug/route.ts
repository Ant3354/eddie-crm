import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Debug endpoint to check webhook status and recent submissions
export async function GET() {
  try {
    // Get recent contacts created via JotForm
    const recentContacts = await prisma.contact.findMany({
      take: 10,
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

    // Get QR code stats
    const qrStats = await prisma.qrCode.aggregate({
      _sum: { scanCount: true },
      _count: { id: true },
    })

    // Get recent QR codes
    const recentQRCodes = await prisma.qrCode.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        source: true,
        scanCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/jotform`,
        recentContacts: recentContacts.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.mobilePhone,
          source: c.tags[0]?.name?.replace('Referral Source: ', '') || 'Unknown',
          createdAt: c.createdAt,
        })),
        qrCodeStats: {
          totalQRCodes: qrStats._count.id,
          totalScans: qrStats._sum.scanCount || 0,
        },
        recentQRCodes,
        message: 'Webhook is active and ready to receive submissions',
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: 'Error checking webhook status'
      },
      { status: 500 }
    )
  }
}

