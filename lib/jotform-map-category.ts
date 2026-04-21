/**
 * Map free-text JotForm "interest type" / role answers to CRM Contact.category enum values.
 */

const CRM_CATEGORIES = new Set([
  'CONSUMER',
  'DENTAL_OFFICE_PARTNER',
  'HEALTH_OFFICE_PARTNER',
  'OTHER_BUSINESS_PARTNER',
  'PROSPECT',
])

/** Exact labels from dropdowns we control. */
const EXACT: Record<string, string> = {
  consumer: 'CONSUMER',
  'dental office': 'DENTAL_OFFICE_PARTNER',
  'health office': 'HEALTH_OFFICE_PARTNER',
  'business partner': 'OTHER_BUSINESS_PARTNER',
  prospect: 'PROSPECT',
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * @param raw — typically dropdown label or short text from JotForm
 * @param fallback — when no match (default PROSPECT)
 */
export function mapJotformInterestToCategory(raw: string | undefined | null, fallback = 'PROSPECT'): string {
  if (!raw || typeof raw !== 'string') return fallback
  const t = norm(raw)
  if (!t) return fallback
  if (CRM_CATEGORIES.has(raw)) return raw

  if (EXACT[t]) return EXACT[t]

  // Phrases used on partner / location forms
  if (t.includes('health office') || t.includes('health location') || t.includes('medical office'))
    return 'HEALTH_OFFICE_PARTNER'
  if (t.includes('dental office') || t.includes('dental location') || t.includes('dental practice'))
    return 'DENTAL_OFFICE_PARTNER'
  if (t.includes('business partner') || t.includes('vendor') || t.includes('partner office'))
    return 'OTHER_BUSINESS_PARTNER'
  if (t.includes('consumer') || t.includes('individual') || t.includes('family plan'))
    return 'CONSUMER'
  if (t.includes('prospect') || t.includes('interested')) return 'PROSPECT'

  return fallback
}
