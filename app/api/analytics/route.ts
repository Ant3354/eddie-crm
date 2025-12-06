import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

