import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** QR rows change on every scan/submit — never cache at the edge. */
export const dynamic = 'force-dynamic'

// GET all QR codes
export async function GET() {
  try {
    const qrCodes = await prisma.qrCode.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        source: true,
        jotFormUrl: true,
        qrCodeUrl: true,
        scanCount: true,
        submissionCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json(qrCodes, {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

