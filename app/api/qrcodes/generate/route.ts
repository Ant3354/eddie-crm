import { NextRequest, NextResponse } from 'next/server'
import { generateQRCode } from '@/lib/qrcode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jotFormUrl, source } = body

    if (!jotFormUrl || !source) {
      return NextResponse.json(
        { error: 'jotFormUrl and source are required' },
        { status: 400 }
      )
    }

    const { qrCodeUrl, qrCodeId } = await generateQRCode(jotFormUrl, source)

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      qrCodeId,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

