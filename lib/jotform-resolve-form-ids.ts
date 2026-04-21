import { fetchJotformForms, getJotformApiKey } from '@/lib/jotform-client'

const MAX_DISCOVERED_FORMS = 35

/** Primary + optional comma-separated extra form IDs (no API call). */
export function getConfiguredJotformFormIds(): string[] {
  const extra =
    process.env.JOTFORM_SYNC_FORM_IDS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) || []
  const primary = process.env.JOTFORM_FORM_ID?.trim()
  return Array.from(new Set([...(primary ? [primary] : []), ...extra]))
}

/**
 * Form IDs to poll for inbox sync. Merges env-configured IDs with all account forms
 * when `JOTFORM_SYNC_DISCOVER_FORMS` is not `false` (default: discover so every form
 * including Health Office, etc., is included without manual env edits).
 */
export async function resolveJotformSyncFormIds(): Promise<string[]> {
  const configured = getConfiguredJotformFormIds()
  const discover = process.env.JOTFORM_SYNC_DISCOVER_FORMS !== 'false'
  if (!discover || !getJotformApiKey()) {
    return configured
  }
  try {
    const forms = await fetchJotformForms(100)
    const discovered = forms.map((f) => f.id).filter(Boolean) as string[]
    const merged = Array.from(new Set([...configured, ...discovered]))
    return merged.slice(0, MAX_DISCOVERED_FORMS)
  } catch {
    return configured
  }
}
