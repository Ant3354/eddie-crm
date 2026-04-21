/**
 * Coerce JotForm "compound" widget answers (name / phone / address) into plain strings
 * so we never persist JSON.stringify blobs on Contact fields.
 */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Try parse a string that is actually JSON (legacy bad imports). */
function tryParseJsonObject(s: string): Record<string, unknown> | null {
  const t = s.trim()
  if (!t.startsWith('{') || !t.endsWith('}')) return null
  try {
    const o = JSON.parse(t) as unknown
    return isPlainObject(o) ? o : null
  } catch {
    return null
  }
}

export function formatJotformAddressObject(o: Record<string, unknown>): string {
  const line1 = String(o.addr_line1 ?? o.address_line1 ?? o.line1 ?? o.street ?? '').trim()
  const line2 = String(o.addr_line2 ?? o.line2 ?? '').trim()
  const city = String(o.city ?? '').trim()
  const state = String(o.state ?? o.region ?? o.province ?? '').trim()
  const zip = String(o.postal ?? o.zip ?? o.zipcode ?? o.postalCode ?? '').trim()
  const country = String(o.country ?? '').trim()
  const cityStateZip = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const parts = [line1, line2, cityStateZip, country].filter(Boolean)
  return parts.join(', ')
}

export function formatJotformPhoneObject(o: Record<string, unknown>): string {
  if (typeof o.full === 'string' && o.full.trim()) return o.full.trim()
  const area = String(o.area ?? '').replace(/\D/g, '')
  const line = String(o.phone ?? o.line ?? '').replace(/\D/g, '')
  if (area && line) {
    const digits = area + line
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return digits
  }
  const s = String(o.phone ?? o.value ?? '').trim()
  return s
}

export function parseJotformNameObject(o: Record<string, unknown>): { first: string; last: string } | null {
  const hasNameShape =
    'first' in o ||
    'last' in o ||
    'firstName' in o ||
    'lastName' in o ||
    ('middle' in o && ('first' in o || 'last' in o))
  if (!hasNameShape) return null
  const first = String(o.first ?? o.firstName ?? '').trim()
  const last = String(o.last ?? o.lastName ?? '').trim()
  const middle = String(o.middle ?? '').trim()
  if (!first && !last && !middle) return null
  const lastJoined = [middle, last].filter(Boolean).join(' ').trim()
  return { first, last: lastJoined || last }
}

/**
 * Turn any JotForm answer value into a single human-readable string for generic answerMap storage.
 */
export function coerceJotformAnswerToString(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') {
    const t = raw.trim()
    const asObj = tryParseJsonObject(t)
    if (asObj) return coerceJotformAnswerToString(asObj)
    return t
  }
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)

  if (!isPlainObject(raw)) return ''

  const name = parseJotformNameObject(raw)
  if (name) return [name.first, name.last].filter(Boolean).join(' ').trim()

  const phone = formatJotformPhoneObject(raw)
  if (phone && ('full' in raw || 'area' in raw || ('phone' in raw && typeof raw.phone === 'string')))
    return phone

  const addr = formatJotformAddressObject(raw)
  if (addr && ('addr_line1' in raw || 'city' in raw || 'state' in raw || 'postal' in raw || 'zip' in raw))
    return addr

  if (typeof raw.text === 'string' && raw.text.trim()) return raw.text.trim()
  if (typeof raw.name === 'string' && raw.name.trim()) return raw.name.trim()

  return ''
}

export type JotformIdentityHints = {
  firstName: string
  lastName: string
  phone: string
  address: string
}

/**
 * Scan raw answers for compound widgets (name / phone / address) using field labels.
 */
export function extractIdentityHintsFromJotformAnswers(answers: unknown[]): JotformIdentityHints {
  let firstName = ''
  let lastName = ''
  let phone = ''
  let address = ''

  if (!Array.isArray(answers)) {
    return { firstName, lastName, phone, address }
  }

  for (const row of answers) {
    const ans = row as Record<string, unknown>
    const label = String(ans.name || ans.text || ans.title || '').toLowerCase().trim()
    const raw = ans.answer ?? ans.value ?? ans.text

    if (!isPlainObject(raw) && typeof raw !== 'string') continue

    let o: Record<string, unknown> | null = isPlainObject(raw) ? raw : null
    if (!o && typeof raw === 'string') {
      o = tryParseJsonObject(raw)
    }
    if (!o) continue

    const name = parseJotformNameObject(o)
    const looksPhone =
      label.includes('phone') ||
      label.includes('mobile') ||
      label.includes('cell') ||
      label.includes('tel') ||
      'full' in o ||
      ('area' in o && 'phone' in o)
    const looksAddr =
      label.includes('address') ||
      'addr_line1' in o ||
      ('city' in o && ('state' in o || 'postal' in o || 'zip' in o))
    // Compound name: prefer when object has first/last, unless it's clearly a phone/address widget.
    if (
      name &&
      !looksAddr &&
      (!looksPhone || label.includes('name') || label.includes('patient') || label.includes('your name'))
    ) {
      if (!firstName && name.first) firstName = name.first
      if (!lastName && name.last) lastName = name.last
      continue
    }

    if (looksPhone && !looksAddr) {
      const p = formatJotformPhoneObject(o)
      if (p && !phone) phone = p
      continue
    }

    if (looksAddr) {
      const a = formatJotformAddressObject(o)
      if (a && !address) address = a
    }
  }

  return { firstName, lastName, phone, address }
}

/**
 * Final cleanup: split JSON blobs mistakenly stored in first/last/phone/address strings.
 */
export function normalizeContactIdentityStrings(
  firstName: string,
  lastName: string,
  phone: string,
  address: string
): JotformIdentityHints {
  let fn = (firstName || '').trim()
  let ln = (lastName || '').trim()
  let ph = (phone || '').trim()
  let addr = (address || '').trim()

  const promotePhoneFrom = (s: string): string | null => {
    const o = tryParseJsonObject(s)
    if (!o) return null
    if (typeof o.full === 'string' && o.full.trim()) return o.full.trim()
    const p = formatJotformPhoneObject(o)
    return p || null
  }

  const promoteNameFrom = (s: string): { first: string; last: string } | null => {
    const o = tryParseJsonObject(s)
    if (!o) return null
    return parseJotformNameObject(o)
  }

  const promoteAddrFrom = (s: string): string | null => {
    const o = tryParseJsonObject(s)
    if (!o) return null
    const a = formatJotformAddressObject(o)
    return a || null
  }

  // Phone JSON stuck in lastName (common when id_* mapping was wrong)
  const phFromLn = promotePhoneFrom(ln)
  if (phFromLn) {
    ph = ph || phFromLn
    ln = ''
  }
  const phFromFn = promotePhoneFrom(fn)
  if (phFromFn) {
    ph = ph || phFromFn
    fn = fn.replace(/^\s*\{[^}]*"full"[^}]*\}\s*/i, '').trim()
  }

  const nmFromFn = promoteNameFrom(fn)
  if (nmFromFn) {
    fn = nmFromFn.first || fn
    ln = ln || nmFromFn.last
  }
  const nmFromLn = promoteNameFrom(ln)
  if (nmFromLn && !fn) {
    fn = nmFromLn.first
    ln = nmFromLn.last
  } else if (nmFromLn && fn && !ln) {
    ln = nmFromLn.last || nmFromLn.first
  }

  const addrParsed = promoteAddrFrom(addr)
  if (addrParsed) addr = addrParsed

  if (addr.includes('"addr_line1"') || addr.includes('"city"')) {
    const o = tryParseJsonObject(addr)
    if (o) {
      const a = formatJotformAddressObject(o)
      if (a) addr = a
    }
  }

  return {
    firstName: fn.replace(/\s+/g, ' ').trim(),
    lastName: ln.replace(/\s+/g, ' ').trim(),
    phone: ph.replace(/\s+/g, ' ').trim(),
    address: addr.replace(/\s+/g, ' ').trim(),
  }
}
