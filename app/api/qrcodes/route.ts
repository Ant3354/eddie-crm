import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** QR rows change on every scan/submit — never cache at the edge. */
export const dynamic = 'force-dynamic'

// GET all QR codes
export async function GET() {
  try {
    const qrCodes = await prisma.qrCode.findMany({
      select: {
        id: true,
        source: true,
        jotFormUrl: true,
        qrCodeUrl: true,
        scanCount: true,
        submissionCount: true,
        lastScanAt: true,
        lastSubmissionAt: true,
        createdAt: true,
      },
    })

    qrCodes.sort((a, b) => {
      const ta = a.lastScanAt?.getTime() ?? 0
      const tb = b.lastScanAt?.getTime() ?? 0
      if (tb !== ta) return tb - ta
      const sa = a.lastSubmissionAt?.getTime() ?? 0
      const sb = b.lastSubmissionAt?.getTime() ?? 0
      if (sb !== sa) return sb - sa
      if (b.scanCount !== a.scanCount) return b.scanCount - a.scanCount
      return b.createdAt.getTime() - a.createdAt.getTime()
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

