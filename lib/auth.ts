import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionJwt, COOKIE_NAME } from '@/lib/auth-session'

export interface AuthUser {
  /** Set when mapped to a row in `User` (omit for anonymous / empty DB). */
  userId?: string
  email: string
  role: string
}

const LOCAL_USER: AuthUser = {
  email: 'local@eddiecrm.local',
  role: 'ADMIN',
}

/**
 * Resolves the signed-in user from JWT cookie, or (when login is not required)
 * the first User row for audit attribution, or a local stub.
 */
export async function getAuthUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const sub = await verifySessionJwt(token)
  if (sub) {
    const user = await prisma.user.findUnique({ where: { id: sub } })
    if (user) {
      return { userId: user.id, email: user.email, role: user.role }
    }
  }

  if (process.env.EDDIE_REQUIRE_LOGIN === 'true') {
    return null
  }

  const first = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (first) {
    return { userId: first.id, email: first.email, role: first.role }
  }

  return { ...LOCAL_USER }
}

export async function getAuthUser(): Promise<AuthUser> {
  return LOCAL_USER
}

export async function requireAuth(): Promise<AuthUser> {
  return LOCAL_USER
}

export { COOKIE_NAME }
