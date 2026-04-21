import { NextRequest, NextResponse } from 'next/server'
import { ingestJotformPayload } from '@/lib/jotform-ingest'

export async function POST(request: NextRequest) {
  let body: unknown = null
  try {
    body = await request.json()
    const result = await ingestJotformPayload(body, {
      requestUrl: request.url,
      syncSource: 'webhook',
      verboseLog: true,
    })
    return NextResponse.json({
      success: true,
      contactId: result.contactId,
      qrCodeId: result.qrCodeId,
      referralCode: result.referralCode,
      message: result.message,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('❌ JotForm webhook error:', error)
    console.error('Error stack:', err?.stack)
    console.error('Request body:', JSON.stringify(body, null, 2))

    return NextResponse.json(
      {
        success: false,
        error: err?.message || String(error),
        message: 'Webhook received but failed to process. Check server logs.',
      },
      { status: 200 }
    )
  }
}
