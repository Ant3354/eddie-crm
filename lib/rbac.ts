export type AppRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'AGENT'
  | 'CONTRACTOR'
  | 'READ_ONLY'
  | string

export function normalizeRole(role: string | null | undefined): AppRole {
  const r = (role || 'AGENT').toUpperCase()
  if (['ADMIN', 'MANAGER', 'AGENT', 'CONTRACTOR', 'READ_ONLY'].includes(r)) return r as AppRole
  return 'AGENT'
}

/** View decrypted DOB/SSN (logged separately). */
export function canViewSensitive(role: AppRole): boolean {
  const r = normalizeRole(String(role))
  return r === 'ADMIN' || r === 'MANAGER' || r === 'AGENT'
}

export function canExportContacts(role: AppRole): boolean {
  const r = normalizeRole(String(role))
  return r !== 'READ_ONLY'
}

export function canBulkWrite(role: AppRole): boolean {
  const r = normalizeRole(String(role))
  return r !== 'READ_ONLY'
}

export function canMergeContacts(role: AppRole): boolean {
  return canBulkWrite(role)
}

export function canUploadDocuments(role: AppRole): boolean {
  return canBulkWrite(role)
}

/** Edit campaign metadata and steps (email/SMS/task copy, timing, order). */
export function canManageCampaigns(role: AppRole): boolean {
  const r = normalizeRole(String(role))
  return r === 'ADMIN' || r === 'MANAGER' || r === 'AGENT'
}
