import { SignJWT, jwtVerify } from 'jose'

function secretKey(): Uint8Array {
  const raw =
    process.env.EDDIE_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : 'dev-eddie-session-secret-min-32-chars!!')
  if (!raw || raw.length < 16) {
    throw new Error(
      'Set EDDIE_SESSION_SECRET (or CRON_SECRET) to a strong value of at least 16 characters for sessions.'
    )
  }
  return new TextEncoder().encode(raw.slice(0, 256))
}

const COOKIE_NAME = 'eddie_session'

export { COOKIE_NAME }

export async function createSessionJwt(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey())
}

export async function verifySessionJwt(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
