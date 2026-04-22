/**
 * Fire-and-forget work after the handler returns. On serverless, completion is not guaranteed;
 * use a real queue for critical side effects in production.
 */
export function runInBackground(task: () => Promise<void>): void {
  setImmediate(() => {
    void task().catch((e) => {
      console.error('[background]', e)
    })
  })
}
