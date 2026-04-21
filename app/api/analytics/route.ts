import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get contacts by category
    const contactsByCategory = await prisma.contact.groupBy({
      by: ['category'],
      _count: true,
    })

    // Get contacts by status
    const contactsByStatus = await prisma.contact.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get referral clicks over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const referralClicks = await prisma.referralClick.findMany({
      where: {
        clickedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        clickedAt: true,
      },
    })

    // Group by date
    const clicksByDate: { [key: string]: number } = {}
    referralClicks.forEach((click) => {
      const date = new Date(click.clickedAt).toISOString().split('T')[0]
      clicksByDate[date] = (clicksByDate[date] || 0) + 1
    })

    const referralTrend = Object.entries(clicksByDate)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get campaign performance
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    })

    const campaignPerformance = campaigns.map((campaign) => ({
      name: campaign.name,
      contacts: campaign._count.contacts,
    }))

    const referralAgg = await prisma.referralConversion.aggregate({ _count: { id: true } })
    const qrAgg = await prisma.qrCode.aggregate({ _sum: { submissionCount: true, scanCount: true } })

    const sourceTags = await prisma.contactTag.findMany({
      where: { name: { startsWith: 'Referral Source:' } },
      select: { name: true },
    })
    const intakeByReferralSource: { name: string; count: number }[] = []
    const srcMap = new Map<string, number>()
    for (const t of sourceTags) {
      const label = t.name.replace(/^Referral Source:\s*/i, '').trim() || 'Unknown'
      srcMap.set(label, (srcMap.get(label) || 0) + 1)
    }
    srcMap.forEach((count, name) => intakeByReferralSource.push({ name, count }))
    intakeByReferralSource.sort((a, b) => b.count - a.count)

    const totalContacts = await prisma.contact.count()
    const qrSubmissionsTotal = qrAgg._sum.submissionCount ?? 0
    const referralConversionsTotal = referralAgg._count.id ?? 0

    return NextResponse.json({
      contactsByCategory: contactsByCategory.map((item) => ({
        name: item.category.replace(/_/g, ' '),
        value: item._count,
      })),
      contactsByStatus: contactsByStatus.map((item) => ({
        name: item.status.replace(/_/g, ' '),
        value: item._count,
      })),
      referralTrend,
      campaignPerformance,
      intakeByReferralSource,
      acquisitionFunnel: {
        totalContacts,
        qrScansTotal: qrAgg._sum.scanCount ?? 0,
        qrSubmissionsTotal,
        referralConversionsTotal,
        /** Rough conversion rate: referral signups / total contacts (not cohort-based). */
        referralConversionRate:
          totalContacts > 0 ? Math.round((referralConversionsTotal / totalContacts) * 1000) / 10 : 0,
        qrSubmissionRate:
          totalContacts > 0 ? Math.round((qrSubmissionsTotal / totalContacts) * 1000) / 10 : 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

