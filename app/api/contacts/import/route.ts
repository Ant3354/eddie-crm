import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const contacts = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue

      const contactData: any = {}
      headers.forEach((header, index) => {
        contactData[header] = values[index]
      })

      try {
        const contact = await prisma.contact.create({
          data: {
            firstName: contactData['first name'] || contactData.firstname || '',
            lastName: contactData['last name'] || contactData.lastname || '',
            email: contactData.email || null,
            mobilePhone: contactData.phone || contactData['mobile phone'] || null,
            address: contactData.address || null,
            languagePreference: contactData.language || 'English',
            category: contactData.category?.toUpperCase() || 'PROSPECT',
            status: contactData.status?.toUpperCase() || 'LEAD',
            emailOptIn: contactData['email opt-in'] === 'true' || contactData.emailoptin === 'true',
            smsOptIn: contactData['sms opt-in'] === 'true' || contactData.smsoptin === 'true',
          },
        })
        contacts.push(contact)
        await logAudit('CONTACT_CREATED', undefined, contact.id)
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      imported: contacts.length,
      errors: errors.length,
      errorDetails: errors,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

