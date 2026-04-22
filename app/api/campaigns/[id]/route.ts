import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserFromRequest } from '@/lib/auth'
import { canManageCampaigns, normalizeRole } from '@/lib/rbac'

const CHANNELS = new Set(['EMAIL', 'SMS', 'TASK'])

function normalizeStepPayload(raw: unknown): {
  id?: string
  stepOrder: number
  triggerDays: number | null
  channel: string
  subject: string | null
  content: string
} | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : undefined
  const stepOrder = Number(o.stepOrder)
  if (!Number.isFinite(stepOrder) || stepOrder < 0) return null
  let triggerDays: number | null = null
  if (o.triggerDays === null || o.triggerDays === '') {
    triggerDays = null
  } else if (typeof o.triggerDays === 'number' && Number.isFinite(o.triggerDays)) {
    triggerDays = Math.trunc(o.triggerDays)
  } else if (typeof o.triggerDays === 'string' && o.triggerDays.trim() !== '') {
    const n = parseInt(o.triggerDays, 10)
    triggerDays = Number.isFinite(n) ? n : null
  }
  const channel = String(o.channel || '').toUpperCase().trim()
  if (!CHANNELS.has(channel)) return null
  const subject =
    o.subject === null || o.subject === undefined
      ? null
      : String(o.subject).trim() || null
  const content = typeof o.content === 'string' ? o.content : String(o.content ?? '')
  if (!content.trim()) return null
  return { id, stepOrder, triggerDays, channel, subject, content: content.trim() }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                mobilePhone: true,
                status: true,
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canManageCampaigns(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, type, isActive, steps } = body

    const campaignId = params.id

    if (Array.isArray(steps)) {
      const normalized = steps
        .map((s: unknown) => normalizeStepPayload(s))
        .filter(Boolean) as Array<NonNullable<ReturnType<typeof normalizeStepPayload>>>
      if (steps.length > 0 && normalized.length === 0) {
        return NextResponse.json(
          { error: 'Invalid steps: each step needs channel (EMAIL/SMS/TASK) and non-empty content.' },
          { status: 400 }
        )
      }
      normalized.sort((a, b) => a.stepOrder - b.stepOrder)

      await prisma.$transaction(async (tx) => {
        await tx.campaign.update({
          where: { id: campaignId },
          data: {
            ...(typeof name === 'string' && name.trim() && { name: name.trim() }),
            ...(description !== undefined && { description: description === null ? null : String(description) }),
            ...(typeof category === 'string' && category.trim() && { category: category.trim() }),
            ...(typeof type === 'string' && type.trim() && { type: type.trim() }),
            ...(typeof isActive === 'boolean' && { isActive }),
          },
        })

        const keptIds: string[] = []
        for (let i = 0; i < normalized.length; i++) {
          const s = normalized[i]
          const order = i
          if (s.id) {
            const existing = await tx.campaignStep.findFirst({
              where: { id: s.id, campaignId },
            })
            if (existing) {
              await tx.campaignStep.update({
                where: { id: s.id },
                data: {
                  stepOrder: order,
                  triggerDays: s.triggerDays,
                  channel: s.channel,
                  subject: s.subject,
                  content: s.content,
                },
              })
              keptIds.push(s.id)
              continue
            }
          }
          const created = await tx.campaignStep.create({
            data: {
              campaignId,
              stepOrder: order,
              triggerDays: s.triggerDays,
              channel: s.channel,
              subject: s.subject,
              content: s.content,
            },
          })
          keptIds.push(created.id)
        }

        await tx.campaignStep.deleteMany({
          where: {
            campaignId,
            ...(keptIds.length ? { id: { notIn: keptIds } } : {}),
          },
        })
      })

      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
          contacts: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  mobilePhone: true,
                  status: true,
                  category: true,
                },
              },
            },
          },
          _count: { select: { contacts: true } },
        },
      })
      return NextResponse.json(campaign)
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(typeof name === 'string' && name.trim() && { name: name.trim() }),
        ...(description !== undefined && { description: description === null ? null : String(description) }),
        ...(typeof category === 'string' && category.trim() && { category: category.trim() }),
        ...(typeof type === 'string' && type.trim() && { type: type.trim() }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                mobilePhone: true,
                status: true,
                category: true,
              },
            },
          },
        },
        _count: { select: { contacts: true } },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canManageCampaigns(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.campaign.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

