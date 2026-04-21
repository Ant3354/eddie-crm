import { NextRequest, NextResponse } from 'next/server'
import { generateQRCode } from '@/lib/qrcode'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        {
          error:
            'DATABASE_URL is not set on this server. In Vercel: Project → Settings → Environment Variables → add DATABASE_URL for your production database (e.g. Neon, Turso, or Postgres). Redeploy after saving.',
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { jotFormUrl, source } = body

    if (!source || typeof source !== 'string') {
      return NextResponse.json({ error: 'source is required' }, { status: 400 })
    }

    if (!jotFormUrl || typeof jotFormUrl !== 'string' || !jotFormUrl.trim()) {
      return NextResponse.json(
        { error: 'jotFormUrl is required (your public JotForm form URL)' },
        { status: 400 }
      )
    }

    const { qrCodeUrl, qrCodeId } = await generateQRCode({
      source,
      jotFormUrl,
    })

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      qrCodeId,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
