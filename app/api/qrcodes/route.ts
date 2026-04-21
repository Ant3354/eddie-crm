import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(qrCodes)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

