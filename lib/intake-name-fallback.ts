/**
 * Recover first/last name when JotForm uses odd labels, short-text "your name",
 * or the visitor writes "contact is Edie" in notes.
 */

const NAMEISH_KEY =
  /full name|your name|patient name|contact name|primary contact|^name$|first and last|who is contacting|legal name/i

const SKIP_KEY =
  /email|e-mail|phone|mobile|address|street|city|state|zip|postal|referral code|company|business name|office name|dental office referring|utm_|qr_code|signature/i

/** Heuristic: value looks like a human name (not a sentence, not a URL). */
function looksLikePersonName(value: string): boolean {
  const v = value.trim()
  if (!v || v.length > 80) return false
  if (/^https?:\/\//i.test(v)) return false
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(v)) return false
  const words = v.split(/\s+/).filter(Boolean)
  if (words.length > 6) return false
  return /^[a-zA-Z][a-zA-Z\s\-'.]*$/i.test(v)
}

export function inferNameFromAnswerMap(answerMap: Record<string, string>): { firstName: string; lastName: string } {
  let bestFirst = ''
  let bestLast = ''
  let bestScore = -1

  for (const [key, val] of Object.entries(answerMap)) {
    const v = (val || '').trim()
    if (!v || !looksLikePersonName(v)) continue
    const kl = key.toLowerCase()
    if (SKIP_KEY.test(kl)) continue

    let score = 0
    if (NAMEISH_KEY.test(kl)) score += 12
    if (kl.includes('name') && !SKIP_KEY.test(kl)) score += 4
    if (kl.includes('patient') || kl.includes('contact')) score += 2
    const wc = v.split(/\s+/).length
    if (wc >= 1 && wc <= 4) score += 1

    if (score > bestScore) {
      bestScore = score
      const parts = v.split(/\s+/).filter(Boolean)
      bestFirst = parts[0] || ''
      bestLast = parts.slice(1).join(' ') || ''
    }
  }

  return { firstName: bestFirst, lastName: bestLast }
}

/** Pull "Edie" / "Edie Smith" from free text (notes, comments). */
export function inferNameFromFreeText(...blobs: string[]): { firstName: string; lastName: string } {
  const text = blobs.filter(Boolean).join('\n').trim()
  if (!text) return { firstName: '', lastName: '' }

  const patterns: RegExp[] = [
    /\bcontact\s+is\s+([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*)*)\b/i,
    /\bname\s+is\s*:?\s*([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*)*)\b/i,
    /\bmy\s+name\s+is\s*:?\s*([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*)*)\b/i,
    /\bi(?:'m| am)\s+([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*)*)\b/i,
  ]

  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const cap = m[1].trim()
      if (looksLikePersonName(cap) || cap.split(/\s+/).length <= 4) {
        const parts = cap.split(/\s+/).filter(Boolean)
        if (parts.length) {
          return { firstName: parts[0], lastName: parts.slice(1).join(' ') || '' }
        }
      }
    }
  }

  return { firstName: '', lastName: '' }
}
