/**
 * Structured server logs. For Sentry, add `@sentry/nextjs` and initialize in `instrumentation.ts`
 * per Sentry’s Next.js guide (optional; not bundled here to keep installs lean).
 */
export function logStructured(
  level: 'info' | 'warn' | 'error',
  event: string,
  data?: Record<string, unknown>
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export async function captureException(
  err: unknown,
  extra?: Record<string, unknown>
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err)
  logStructured('error', 'exception', { message, ...extra })
}

export function initObservability(): void {
  logStructured('info', 'observability_ready', {
    nodeEnv: process.env.NODE_ENV,
    sentryConfigured: Boolean(process.env.SENTRY_DSN),
  })
}
