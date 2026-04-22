import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { requestMeta } from '@/lib/request-meta'

export const dynamic = 'force-dynamic'

/**
 * Generic vendor-agnostic intake hook. Normalize any form tool to a minimal contact shape.
 * Auth: Authorization: Bearer <WEBHOOK_INBOX_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_INBOX_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'WEBHOOK_INBOX_SECRET is not configured' },
      { status: 503 }
    )
  }
  const auth = request.headers.get('authorization')?.trim() || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (bearer !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const vendor = String(body.vendor || 'generic').slice(0, 64)
    const firstName = String(body.firstName || body.first_name || 'Lead').slice(0, 120)
    const lastName = String(body.lastName || body.last_name || 'Intake').slice(0, 120)
    const email = body.email ? String(body.email).slice(0, 255) : null
    const mobilePhone = body.phone || body.mobilePhone
      ? String(body.phone || body.mobilePhone).slice(0, 64)
      : null
    const leadNotes = body.notes || body.message ? String(body.notes || body.message).slice(0, 4000) : null

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        mobilePhone,
        category: 'PROSPECT',
        status: 'LEAD',
        leadNotes,
      },
    })

    await logAudit(
      'WEBHOOK_INTAKE',
      undefined,
      contact.id,
      vendor,
      undefined,
      undefined,
      requestMeta(request),
      { vendor, externalId: body.externalId ?? null }
    )

    return NextResponse.json({ ok: true, contactId: contact.id })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
