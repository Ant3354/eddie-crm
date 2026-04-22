import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getAuthUserFromRequest } from '@/lib/auth'
import { requestMeta } from '@/lib/request-meta'
import { canBulkWrite, normalizeRole } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const paymentAlert = searchParams.get('paymentAlert')
    const search = searchParams.get('search')

    const where: any = {}

    if (category) {
      where.category = category
    }
    if (status) {
      where.status = status
    }
    if (paymentAlert === 'true') {
      where.paymentIssueAlert = true
    }
    if (search) {
      // SQLite doesn't support case-insensitive mode, so we'll filter in memory
      // For production with PostgreSQL, use: mode: 'insensitive'
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { mobilePhone: { contains: search } },
      ]
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        tags: true,
        policies: true,
        tasks: {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
          take: 5,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 500,
    })

    contacts.sort((a, b) => {
      const ja = a.lastJotformSubmissionAt?.getTime() ?? 0
      const jb = b.lastJotformSubmissionAt?.getTime() ?? 0
      if (jb !== ja) return jb - ja
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })

    return NextResponse.json(contacts, {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

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
    const {
      firstName,
      lastName,
      email,
      mobilePhone,
      address,
      languagePreference,
      category,
      status,
      emailOptIn,
      smsOptIn,
    } = body

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        mobilePhone,
        address,
        languagePreference: languagePreference || 'English',
        category: category || 'PROSPECT',
        status: status || 'LEAD',
        emailOptIn: emailOptIn || false,
        smsOptIn: smsOptIn || false,
      },
    })

    const meta = requestMeta(request)
    await logAudit('CONTACT_CREATED', auth.userId, contact.id, undefined, undefined, undefined, meta)
    if (emailOptIn) {
      await logAudit('CONSENT_EMAIL_OPT_IN', auth.userId, contact.id, 'emailOptIn', 'false', 'true', meta)
    }
    if (smsOptIn) {
      await logAudit('CONSENT_SMS_OPT_IN', auth.userId, contact.id, 'smsOptIn', 'false', 'true', meta)
    }

    return NextResponse.json(contact)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

