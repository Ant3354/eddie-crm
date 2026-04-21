import { NextRequest, NextResponse } from 'next/server'
import { syncJotformInbox } from '@/lib/jotform-inbox-sync'

export const dynamic = 'force-dynamic'

/**
 * Scheduled JotForm inbox → CRM import (REST API poll).
 * Configure in vercel.json or hit manually with Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const start = Date.now()
    const result = await syncJotformInbox()
    const duration = Date.now() - start

    return NextResponse.json({
      success: result.ok,
      ...result,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('JotForm sync cron error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
