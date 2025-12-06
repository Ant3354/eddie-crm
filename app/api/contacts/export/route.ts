import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: any = {}
    if (category) where.category = category
    if (status) where.status = status

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // CSV header
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Category', 'Status', 'Email Opt-in', 'SMS Opt-in']
    const csvRows = [headers.join(',')]

    // CSV rows
    contacts.forEach((contact) => {
      csvRows.push([
        contact.firstName,
        contact.lastName,
        contact.email || '',
        contact.mobilePhone || '',
        contact.address || '',
        contact.category,
        contact.status,
        contact.emailOptIn ? 'Yes' : 'No',
        contact.smsOptIn ? 'Yes' : 'No',
      ].join(','))
    })

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="contacts-export.csv"',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

