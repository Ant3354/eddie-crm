/**
 * Public and internal origins for links and server-side fetch() to this app.
 * `package.json` dev/start use port 3001 — defaults must match or tests and webhooks break.
 */
const DEFAULT_PORT = '3001'

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

/** User-facing links (referrals, emails, QR). Prefer NEXT_PUBLIC_APP_URL in production. */
export function getPublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)
  const port = process.env.PORT || DEFAULT_PORT
  return `http://localhost:${port}`
}

/** Same machine HTTP (cron/tests calling local routes). Prefer INTERNAL_APP_URL in Docker. */
export function getInternalAppOrigin(): string {
  const fromEnv = process.env.INTERNAL_APP_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (pub) return stripTrailingSlash(pub)
  const port = process.env.PORT || DEFAULT_PORT
  return `http://127.0.0.1:${port}`
}
