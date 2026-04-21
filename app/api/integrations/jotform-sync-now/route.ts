import { NextRequest, NextResponse } from 'next/server'
import { syncJotformInbox } from '@/lib/jotform-inbox-sync'

export const dynamic = 'force-dynamic'

/**
 * Trigger JotForm inbox → CRM import immediately (same work as /api/cron/jotform-sync).
 * Auth (either works):
 * - Authorization: Bearer <CRON_SECRET>
 * - Authorization: Bearer <EDDIE_UI_SYNC_SECRET> (when that env is set — use a dedicated random value for the UI button only)
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')?.trim() || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const cronSecret = process.env.CRON_SECRET?.trim()
  const uiSyncSecret = process.env.EDDIE_UI_SYNC_SECRET?.trim()

  const okCron = Boolean(cronSecret && bearer && bearer === cronSecret)
  const okUi = Boolean(uiSyncSecret && bearer && bearer === uiSyncSecret)

  if (!okCron && !okUi) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        hint:
          'Send Authorization: Bearer with CRON_SECRET, or set EDDIE_UI_SYNC_SECRET in Vercel and use that value as the bearer.',
      },
      { status: 401 }
    )
  }

  try {
    const start = Date.now()
    const result = await syncJotformInbox()
    const duration = Date.now() - start
    return NextResponse.json(
      {
        success: result.ok,
        ...result,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
