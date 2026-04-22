import { prisma } from './prisma'

export async function logAudit(
  action: string,
  userId?: string,
  contactId?: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  request?: { ip?: string; userAgent?: string },
  details?: Record<string, unknown>
) {
  let detailsJson: string | null = null
  if (details && typeof details === 'object') {
    try {
      detailsJson = JSON.stringify(details).slice(0, 8000)
    } catch {
      detailsJson = null
    }
  }
  await prisma.auditLog.create({
    data: {
      userId,
      contactId,
      action,
      fieldName,
      oldValue: oldValue ? String(oldValue).substring(0, 500) : null,
      newValue: newValue ? String(newValue).substring(0, 500) : null,
      detailsJson,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    },
  })
}

