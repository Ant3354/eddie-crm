import type { NextRequest } from 'next/server'

export function requestMeta(request: NextRequest): { ip?: string; userAgent?: string } {
  const fwd = request.headers.get('x-forwarded-for')
  const ip =
    fwd?.split(',')[0]?.trim() ||
    (request as NextRequest & { ip?: string }).ip ||
    undefined
  const userAgent = request.headers.get('user-agent') || undefined
  return { ip, userAgent }
}
