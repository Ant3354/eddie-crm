/**
 * Build a readable intake snapshot and extract common dental-survey fields from a JotForm answer map.
 */

function titleCaseKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function buildJotformIntakeSummary(answerMap: Record<string, string>, maxLen = 32000): string {
  const lines: string[] = []
  const keys = Object.keys(answerMap).sort((a, b) => a.localeCompare(b))
  for (const key of keys) {
    const raw = answerMap[key]
    if (raw == null) continue
    const val = String(raw).trim()
    if (!val) continue
    const lk = key.toLowerCase()
    if (lk.startsWith('id_') || lk.startsWith('answer_')) continue
    lines.push(`${titleCaseKey(key)}: ${val}`)
  }
  const s = lines.join('\n')
  return s.length > maxLen ? `${s.slice(0, maxLen)}\n… (truncated)` : s
}

export function extractDobFromAnswerMap(answerMap: Record<string, string>): string {
  for (const [k, v] of Object.entries(answerMap)) {
    const kk = k.toLowerCase()
    if (
      kk.includes('birth') ||
      kk.includes('dob') ||
      kk.includes('date of birth') ||
      kk === 'birthday'
    ) {
      const t = String(v).trim()
      if (t) return t
    }
  }
  return ''
}

export function extractGenderFromAnswerMap(answerMap: Record<string, string>): string {
  for (const [k, v] of Object.entries(answerMap)) {
    const kk = k.toLowerCase()
    if (kk.includes('gender') || kk === 'sex' || kk.includes('male or female')) {
      const t = String(v).trim()
      if (t) return t.slice(0, 80)
    }
  }
  return ''
}

export function buildLeadNotesBlock(
  appointmentTime: string,
  notes: string,
  interestType: string
): string {
  const parts: string[] = []
  if (interestType && interestType !== 'PROSPECT') {
    parts.push(`Interest / category: ${interestType}`)
  }
  if (appointmentTime?.trim()) {
    parts.push(`Best time to reach: ${appointmentTime.trim()}`)
  }
  if (notes?.trim()) {
    parts.push(`Notes: ${notes.trim()}`)
  }
  return parts.join('\n\n') || ''
}
