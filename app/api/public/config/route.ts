import { NextResponse } from 'next/server'

/** Public read-only hints for QR / webhook setup (no secrets). */
export async function GET() {
  const crmBaseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PUBLIC_INTAKE_BASE_URL ||
    'http://localhost:3001'
  ).replace(/\/$/, '')

  return NextResponse.json({
    crmBaseUrl,
    jotFormWebhookHint:
      'Point your JotForm form webhook to your production URL, e.g. ' +
      `${crmBaseUrl}/api/webhooks/jotform (POST, JSON).`,
  })
}
