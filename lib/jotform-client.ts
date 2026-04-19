/**
 * Server-only JotForm REST client (API key never sent to the browser).
 * @see https://api.jotform.com/docs/
 */

const DEFAULT_BASE = 'https://api.jotform.com'

export function getJotformApiKey(): string | undefined {
  return process.env.JOTFORM_API_KEY?.trim() || undefined
}

export function getJotformApiBase(): string {
  return (process.env.JOTFORM_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
}

type JotformEnvelope<T> = {
  responseCode?: number
  message?: string
  content?: T
  [k: string]: unknown
}

async function jotformRequest<T>(path: string): Promise<T> {
  const key = getJotformApiKey()
  if (!key) {
    throw new Error('JOTFORM_API_KEY is not set')
  }
  const base = getJotformApiBase()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    headers: { APIKEY: key },
    cache: 'no-store',
  })
  const body = (await res.json().catch(() => ({}))) as JotformEnvelope<T> & {
    error?: string
  }
  const rc = body.responseCode
  if (!res.ok || (typeof rc === 'number' && rc !== 200)) {
    const msg =
      (typeof body.message === 'string' && body.message) ||
      (typeof body.error === 'string' && body.error) ||
      (typeof rc === 'number' ? `JotForm responseCode ${rc}` : `HTTP ${res.status}`)
    throw new Error(msg)
  }
  return (body.content !== undefined ? body.content : body) as T
}

export type JotformUserContent = {
  name?: string
  email?: string
  username?: string
  account_type_name?: string
  time_zone?: string
}

export async function fetchJotformUser(): Promise<JotformUserContent> {
  return jotformRequest<JotformUserContent>('/user')
}

export type JotformFormSummary = {
  id: string
  title?: string
  status?: string
  url?: string
}

function normalizeFormList(raw: unknown): JotformFormSummary[] {
  if (Array.isArray(raw)) return raw as JotformFormSummary[]
  if (raw && typeof raw === 'object') {
    const maybeForms = (raw as { forms?: unknown }).forms
    if (Array.isArray(maybeForms)) return maybeForms as JotformFormSummary[]
    return Object.values(raw as Record<string, unknown>).filter(
      (v): v is JotformFormSummary =>
        !!v &&
        typeof v === 'object' &&
        'id' in (v as object) &&
        typeof (v as JotformFormSummary).id === 'string'
    )
  }
  return []
}

export async function fetchJotformForms(limit = 50): Promise<JotformFormSummary[]> {
  const raw = await jotformRequest<unknown>(`/user/forms?limit=${limit}`)
  return normalizeFormList(raw)
}

export type JotformSubmissionPreview = {
  id?: string
  created_at?: string
  answers?: Record<string, unknown>
}

function normalizeSubmissionList(raw: unknown): JotformSubmissionPreview[] {
  if (Array.isArray(raw)) return raw as JotformSubmissionPreview[]
  if (raw && typeof raw === 'object') {
    const subs = (raw as { submissions?: unknown }).submissions
    if (Array.isArray(subs)) return subs as JotformSubmissionPreview[]
    return Object.values(raw as Record<string, unknown>).filter(
      (v): v is JotformSubmissionPreview =>
        !!v && typeof v === 'object' && ('id' in (v as object) || 'answers' in (v as object))
    )
  }
  return []
}

export async function fetchJotformSubmissions(
  formId: string,
  limit = 3
): Promise<{ submissions: JotformSubmissionPreview[]; rawCount?: number }> {
  const raw = await jotformRequest<unknown>(
    `/form/${encodeURIComponent(formId)}/submissions?limit=${limit}`
  )
  return { submissions: normalizeSubmissionList(raw) }
}
