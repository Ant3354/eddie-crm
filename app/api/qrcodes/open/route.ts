import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { trackQRScan } from '@/lib/qrcode'

/**
 * Tracked entry URL for QR codes: increments scanCount then redirects to the real JotForm URL.
 * The QR image encodes this URL so Eddie CRM sees every scan.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Missing id (QR record id)' }, { status: 400 })
  }

  try {
    const qr = await prisma.qrCode.findUnique({
      where: { id },
      select: { jotFormUrl: true },
    })
    if (!qr?.jotFormUrl?.trim()) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
    }

    await trackQRScan(id)

    const dest = qr.jotFormUrl.trim()
    return NextResponse.redirect(dest, 302)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
