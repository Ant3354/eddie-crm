import { normalizeContactIdentityStrings } from '@/lib/jotform-field-coercion'

/** Normalize stored contact fields for UI (fixes legacy JotForm JSON blobs in name/phone/address). */
export function getContactDisplayIdentity(c: {
  firstName?: string | null
  lastName?: string | null
  mobilePhone?: string | null
  address?: string | null
}) {
  return normalizeContactIdentityStrings(
    String(c.firstName ?? '').trim(),
    String(c.lastName ?? '').trim(),
    String(c.mobilePhone ?? '').trim(),
    String(c.address ?? '').trim()
  )
}
