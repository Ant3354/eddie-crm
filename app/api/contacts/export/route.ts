import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getAuthUserFromRequest } from '@/lib/auth'
import { canExportContacts, normalizeRole } from '@/lib/rbac'
import { requestMeta } from '@/lib/request-meta'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 5000

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canExportContacts(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (status) where.status = status

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS,
    })

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Address',
      'Category',
      'Status',
      'Email Opt-in',
      'SMS Opt-in',
    ]
    const csvRows = [headers.join(',')]

    contacts.forEach((contact) => {
      csvRows.push(
        [
          contact.firstName,
          contact.lastName,
          contact.email || '',
          contact.mobilePhone || '',
          (contact.address || '').replace(/\n/g, ' '),
          contact.category,
          contact.status,
          contact.emailOptIn ? 'Yes' : 'No',
          contact.smsOptIn ? 'Yes' : 'No',
        ].join(',')
      )
    })

    const csv = csvRows.join('\n')

    await logAudit(
      'CONTACTS_EXPORTED',
      auth.userId,
      undefined,
      undefined,
      undefined,
      undefined,
      requestMeta(request),
      { rowCount: contacts.length, category: category || null, status: status || null }
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="contacts-export.csv"',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
