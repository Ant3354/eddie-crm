import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth-session'
import { getAuthUserFromRequest } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { requestMeta } from '@/lib/request-meta'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request)
  if (user?.userId) {
    await logAudit('USER_LOGOUT', user.userId, undefined, undefined, undefined, undefined, requestMeta(request))
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
