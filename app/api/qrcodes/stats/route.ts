import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const qrCodes = await prisma.qrCode.findMany()

    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0)
    
    const scansBySource = qrCodes.reduce((acc, qr) => {
      acc[qr.source] = (acc[qr.source] || 0) + qr.scanCount
      return acc
    }, {} as { [key: string]: number })

    const topSources = Object.entries(scansBySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      totalScans,
      totalQRCodes: qrCodes.length,
      scansBySource,
      topSources,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

