/** List endpoints return an array; on error the API may return `{ error: string }`. */
export function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : []
}
