import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

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
      take: 100,
    })

    return NextResponse.json(contacts)
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

    await logAudit('CONTACT_CREATED', undefined, contact.id)

    return NextResponse.json(contact)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

