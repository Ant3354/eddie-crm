import { prisma } from '@/lib/prisma'

export type IntakePipelineRule = {
  id: string
  enabled?: boolean
  /** Run only the first time a contact row is created from this intake. */
  newContactOnly?: boolean
  /** Source / referral tag substring match (case-insensitive). Empty = any. */
  ifSourceContains?: string
  /** When true, only run if submission is tied to a QR (JotForm / intake with qr). */
  ifHasQr?: boolean
  setStatus?: string
  setCategory?: string
  setOwnerUserId?: string | null
  taskTitle?: string
  taskDescription?: string
  /** Hours from now for task due date (default 24). */
  taskDueHours?: number
  taskAssigneeUserId?: string | null
}

export type CrmSettingsShape = {
  pipelineRules?: IntakePipelineRule[]
  /** Send first reminder when dueDate is within this many hours (e.g. 24). */
  taskReminderHoursBeforeDue?: number
  version?: number
}

const DEFAULTS: CrmSettingsShape = {
  pipelineRules: [],
  taskReminderHoursBeforeDue: 24,
}

export function parseCrmSettingsJson(raw: string | null | undefined): CrmSettingsShape {
  if (!raw || !raw.trim()) return { ...DEFAULTS }
  try {
    const o = JSON.parse(raw) as CrmSettingsShape
    return {
      ...DEFAULTS,
      ...o,
      pipelineRules: Array.isArray(o.pipelineRules) ? o.pipelineRules : [],
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export async function getCrmSettings(): Promise<{ id: string; settings: CrmSettingsShape }> {
  let row = await prisma.crmSettings.findUnique({ where: { id: 'default' } })
  if (!row) {
    row = await prisma.crmSettings.create({
      data: { id: 'default', settingsJson: JSON.stringify(DEFAULTS) },
    })
  }
  return { id: row.id, settings: parseCrmSettingsJson(row.settingsJson) }
}

export async function saveCrmSettings(settings: CrmSettingsShape): Promise<void> {
  const json = JSON.stringify({
    ...settings,
    version: 1,
  })
  await prisma.crmSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', settingsJson: json },
    update: { settingsJson: json },
  })
}
