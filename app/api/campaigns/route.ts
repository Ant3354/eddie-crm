import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(campaigns)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, type, steps } = body

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        category: category || 'CONSUMER',
        type: type || 'CUSTOM',
        steps: {
          create: steps?.map((step: any, index: number) => ({
            stepOrder: index,
            triggerDays: step.triggerDays,
            channel: step.channel,
            subject: step.subject,
            content: step.content,
          })) || [],
        },
      },
      include: {
        steps: true,
      },
    })

    return NextResponse.json(campaign)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

