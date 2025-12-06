import { NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email-test'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, content, contactId } = body

    const result = await sendTestEmail(
      to || 'test@example.com',
      subject || 'Test Email',
      content || '<h1>Test Email</h1><p>This is a test email from EDDIE CRM.</p>',
      contactId
    )

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

