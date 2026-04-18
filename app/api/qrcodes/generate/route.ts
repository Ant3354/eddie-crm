import { NextRequest, NextResponse } from 'next/server'
import { generateQRCode } from '@/lib/qrcode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jotFormUrl, source, useLocalIntake } = body

    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 })
    }

    if (!useLocalIntake && !jotFormUrl) {
      return NextResponse.json(
        { error: 'jotFormUrl is required unless useLocalIntake is true' },
        { status: 400 }
      )
    }

    const { qrCodeUrl, qrCodeId } = await generateQRCode({
      source,
      jotFormUrl,
      useLocalIntake: Boolean(useLocalIntake),
    })

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

