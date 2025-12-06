import { NextResponse } from 'next/server'
import { sendTestSMS } from '@/lib/sms-test'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, message, contactId } = body

    const result = await sendTestSMS(
      to || '+1234567890',
      message || 'Test SMS from EDDIE CRM',
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

