/**
 * Base URL baked into QR codes for built-in /intake links.
 * Use NEXT_PUBLIC_INTAKE_QR_BASE_URL when phones are on a different network than the PC
 * (e.g. https://your-name.ngrok-free.app or a Cloudflare Tunnel URL pointing at this app).
 */
export function getIntakeQrEncodeBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_INTAKE_QR_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PUBLIC_INTAKE_BASE_URL ||
    'http://localhost:3001'
  return raw.replace(/\/$/, '')
}

export type QrIntakeReachability = 'loopback' | 'private-lan' | 'possibly-public' | 'invalid'

export function classifyIntakeQrBaseUrl(baseUrl: string): QrIntakeReachability {
  try {
    const u = new URL(baseUrl)
    const h = u.hostname.toLowerCase()
    if (!h) return 'invalid'
    if (h === 'localhost' || h === '127.0.0.1') return 'loopback'
    if (/^192\.168\./.test(h)) return 'private-lan'
    if (/^10\./.test(h)) return 'private-lan'
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return 'private-lan'
    return 'possibly-public'
  } catch {
    return 'invalid'
  }
}
