import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, contactIds, tag } = body || {}
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'contactIds required' }, { status: 400 })
    }

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
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      await prisma.sensitiveData.deleteMany({
        where: { contactId: { in: contactIds } },
      })
      const result = await prisma.contact.deleteMany({
        where: { id: { in: contactIds } },
      })
      return NextResponse.json({ success: true, deleted: result.count })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
