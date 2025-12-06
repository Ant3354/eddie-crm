import { NextResponse } from 'next/server'
import { processCampaigns } from '@/lib/campaigns'

export async function GET() {
  // Allow GET for easy cron job setup
  return await POST()
}

export async function POST() {
  try {
    const startTime = Date.now()
    await processCampaigns()
    const duration = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campaigns processed successfully',
      duration: `${duration}ms`
    })
  } catch (error: any) {
    console.error('Campaign processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

