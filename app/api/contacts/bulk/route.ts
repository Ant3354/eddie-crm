import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getAuthUserFromRequest } from '@/lib/auth'
import { canBulkWrite, normalizeRole } from '@/lib/rbac'
import { requestMeta } from '@/lib/request-meta'

export const dynamic = 'force-dynamic'

const MAX_IDS = 200

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canBulkWrite(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, contactIds, tag, ownerUserId } = body || {}
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds required' }, { status: 400 })
    }
    if (contactIds.length > MAX_IDS) {
      return NextResponse.json(
        { error: `At most ${MAX_IDS} contacts per bulk request` },
        { status: 400 }
      )
    }

    const meta = requestMeta(request)

    if (action === 'addTag') {
      if (!tag) return NextResponse.json({ error: 'tag required' }, { status: 400 })
      await prisma.$transaction(
        contactIds.map((id: string) =>
          prisma.contactTag.upsert({
            where: { contactId_name: { contactId: id, name: tag } },
            create: { contactId: id, name: tag },
            update: {},
          })
        )
      )
      await logAudit(
        'BULK_ADD_TAG',
        auth.userId,
        undefined,
        undefined,
        undefined,
        undefined,
        meta,
        { count: contactIds.length, tag }
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'assignOwner') {
      if (!ownerUserId || typeof ownerUserId !== 'string') {
        return NextResponse.json({ error: 'ownerUserId required' }, { status: 400 })
      }
      const owner = await prisma.user.findUnique({ where: { id: ownerUserId } })
      if (!owner) {
        return NextResponse.json({ error: 'Invalid ownerUserId' }, { status: 400 })
      }
      await prisma.contact.updateMany({
        where: { id: { in: contactIds } },
        data: { ownerUserId },
      })
      await logAudit(
        'BULK_ASSIGN_OWNER',
        auth.userId,
        undefined,
        undefined,
        undefined,
        undefined,
        meta,
        { count: contactIds.length, ownerUserId }
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      await prisma.sensitiveData.deleteMany({
        where: { contactId: { in: contactIds } },
      })
      const result = await prisma.contact.deleteMany({
        where: { id: { in: contactIds } },
      })
      await logAudit(
        'BULK_DELETE',
        auth.userId,
        undefined,
        undefined,
        undefined,
        undefined,
        meta,
        { count: contactIds.length, deleted: result.count }
      )
      return NextResponse.json({ success: true, deleted: result.count })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
