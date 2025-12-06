import { NextRequest, NextResponse } from 'next/server'
import { trackReferralClick } from '@/lib/referral-links'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const source = request.headers.get('referer') || 'direct'
    
    await trackReferralClick(params.code, source)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

