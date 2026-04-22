import { prisma } from '@/lib/prisma'

/** Map a JotForm `formID` to tag, campaign, pipeline, task, and internal notify. */
export type JotformFormRoute = {
  id: string
  enabled?: boolean
  /** JotForm numeric form id as string. */
  formId: string
  label?: string
  /** ContactTag name applied on each matching submission. */
  tag: string
  /** Must match an active `Campaign.name` in the database. */
  campaignName: string
  setStatus?: string
  setCategory?: string
  taskTitle?: string
  taskDescription?: string
  taskDueHours?: number
  taskAssigneeUserId?: string | null
  /** Default true: email INTERNAL_NOTIFY_EMAIL or first admin. */
  notifyInternal?: boolean
}

export type IntakePipelineRule = {
  id: string
  enabled?: boolean
  /** Run only the first time a contact row is created from this intake. */
  newContactOnly?: boolean
  /** Source / referral tag substring match (case-insensitive). Empty = any. */
  ifSourceContains?: string
  /** When set, contact status must match exactly. */
  ifContactStatus?: string
  /** When true, only if the contact has no policy rows yet. */
  ifNoPolicy?: boolean
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
  /** Per-form JotForm routing (merged with env `JOTFORM_FORM_ID_*` defaults). */
  jotformFormRoutes?: JotformFormRoute[]
  /**
   * Inserted into campaign emails as [REFERRAL_APPRECIATION_COPY] for compliance-friendly
   * referral / incentive language (edit anytime without code changes).
   */
  referralAppreciationCopy?: string
  /** Send first reminder when dueDate is within this many hours (e.g. 24). */
  taskReminderHoursBeforeDue?: number
  /** When greater than 0, cron `/api/cron/file-retention` deletes contact uploads older than this many days. */
  uploadRetentionDays?: number
  version?: number
}

const DEFAULT_REFERRAL_APPRECIATION =
  'Referral appreciation details vary by plan and state. Contact us for the current, compliant summary of any referral or thank-you offers.'

const DEFAULTS: CrmSettingsShape = {
  pipelineRules: [],
  jotformFormRoutes: [],
  referralAppreciationCopy: DEFAULT_REFERRAL_APPRECIATION,
  taskReminderHoursBeforeDue: 24,
  uploadRetentionDays: 0,
}

/** Merge a partial PUT body with stored settings so omitted arrays are not wiped. */
export function mergeCrmSettingsPatch(
  existing: CrmSettingsShape,
  patch: Partial<CrmSettingsShape>
): CrmSettingsShape {
  return {
    ...existing,
    ...patch,
    pipelineRules: Array.isArray(patch.pipelineRules) ? patch.pipelineRules : existing.pipelineRules ?? [],
    jotformFormRoutes: Array.isArray(patch.jotformFormRoutes)
      ? patch.jotformFormRoutes
      : existing.jotformFormRoutes ?? [],
    referralAppreciationCopy:
      typeof patch.referralAppreciationCopy === 'string'
        ? patch.referralAppreciationCopy
        : existing.referralAppreciationCopy,
    taskReminderHoursBeforeDue:
      typeof patch.taskReminderHoursBeforeDue === 'number'
        ? patch.taskReminderHoursBeforeDue
        : existing.taskReminderHoursBeforeDue ?? DEFAULTS.taskReminderHoursBeforeDue,
    uploadRetentionDays:
      typeof patch.uploadRetentionDays === 'number'
        ? patch.uploadRetentionDays
        : existing.uploadRetentionDays ?? DEFAULTS.uploadRetentionDays,
  }
}

export function parseCrmSettingsJson(raw: string | null | undefined): CrmSettingsShape {
  if (!raw || !raw.trim()) return { ...DEFAULTS }
  try {
    const o = JSON.parse(raw) as CrmSettingsShape
    return {
      ...DEFAULTS,
      ...o,
      pipelineRules: Array.isArray(o.pipelineRules) ? o.pipelineRules : [],
      jotformFormRoutes: Array.isArray(o.jotformFormRoutes) ? o.jotformFormRoutes : [],
      referralAppreciationCopy:
        typeof o.referralAppreciationCopy === 'string' && o.referralAppreciationCopy.trim()
          ? o.referralAppreciationCopy
          : DEFAULTS.referralAppreciationCopy,
      uploadRetentionDays:
        typeof o.uploadRetentionDays === 'number' && o.uploadRetentionDays >= 0
          ? o.uploadRetentionDays
          : DEFAULTS.uploadRetentionDays,
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
