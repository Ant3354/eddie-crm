import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [totalClicks, totalConversions, referralLinks] = await Promise.all([
      prisma.referralClick.count(),
      prisma.referralConversion.count(),
      prisma.referralLink.findMany({
        include: {
          clicks: true,
          conversions: true,
        },
      }),
    ])

    const topReferrers = referralLinks
      .map(link => ({
        contactId: link.contactId,
        clicks: link.clickCount,
        conversions: link.conversionCount,
        conversionRate: link.clickCount > 0 
          ? (link.conversionCount / link.clickCount * 100).toFixed(2)
          : '0.00',
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10)

    return NextResponse.json({
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 
        ? ((totalConversions / totalClicks) * 100).toFixed(2)
        : '0.00',
      topReferrers,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

