import { NextRequest, NextResponse } from 'next/server'
import { processCampaigns } from '@/lib/campaigns'

// This endpoint can be called by a cron job
// For production: Set up a cron service to call this URL every hour
export async function GET(request: NextRequest) {
  // Optional: Add authentication/secret check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const startTime = Date.now()
    await processCampaigns()
    const duration = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campaigns processed successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Campaign processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return await GET(request)
}

