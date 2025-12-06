import { NextRequest, NextResponse } from 'next/server'
import { getReferralStats, generateReferralLink } from '@/lib/referral-links'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let stats = await getReferralStats(params.id)
    
    // If no referral link exists, create one
    if (!stats) {
      await generateReferralLink(params.id)
      stats = await getReferralStats(params.id)
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

