import { NextResponse } from 'next/server'
import { classifyIntakeQrBaseUrl, getIntakeQrEncodeBaseUrl } from '@/lib/intake-qr-base'

/** Public read-only settings for QR / intake flows (no auth). */
export async function GET() {
  const intakeBaseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PUBLIC_INTAKE_BASE_URL ||
    'http://localhost:3001'
  ).replace(/\/$/, '')

  const qrEncodeBaseUrl = getIntakeQrEncodeBaseUrl()
  const qrEncodeReachability = classifyIntakeQrBaseUrl(qrEncodeBaseUrl)
  const usesDedicatedQrBase = Boolean(process.env.NEXT_PUBLIC_INTAKE_QR_BASE_URL?.trim())

  const offlineModeDefault = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true'

  return NextResponse.json({
    intakeBaseUrl,
    /** URL prefix embedded in new “local intake” QR codes (may differ from intakeBaseUrl for tunnels). */
    qrEncodeBaseUrl,
    qrEncodeReachability,
    usesDedicatedQrBase,
    offlineIntakePath: '/intake',
    jotFormRequiresInternet: true,
    offlineModeDefault,
    offlineModeDescription:
      'Built-in intake encodes a link your phone must open. Same Wi‑Fi: set NEXT_PUBLIC_APP_URL to this PC’s LAN IP. Anyone on cellular or another Wi‑Fi needs a reachable HTTPS URL — set NEXT_PUBLIC_INTAKE_QR_BASE_URL (ngrok / Cloudflare Tunnel / hosted reverse proxy) to that public address.',
  })
}
