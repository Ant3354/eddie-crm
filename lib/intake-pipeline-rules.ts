import { prisma } from '@/lib/prisma'
import type { IntakePipelineRule } from '@/lib/crm-settings'
import { getCrmSettings } from '@/lib/crm-settings'

export type IntakePipelineContext = {
  contactId: string
  isNewContact: boolean
  source: string
  qrCodeId: string | null
}

function ruleMatches(
  rule: IntakePipelineRule,
  ctx: IntakePipelineContext
): boolean {
  if (rule.enabled === false) return false
  if (rule.newContactOnly && !ctx.isNewContact) return false

  const needle = (rule.ifSourceContains || '').trim().toLowerCase()
  if (needle && !ctx.source.toLowerCase().includes(needle)) return false

  if (rule.ifHasQr === true && !ctx.qrCodeId) return false
  if (rule.ifHasQr === false && ctx.qrCodeId) return false

  return true
}

export async function applyIntakePipelineRules(ctx: IntakePipelineContext): Promise<void> {
  const { settings } = await getCrmSettings()
  const rules = settings.pipelineRules || []
  if (rules.length === 0) return

  const updates: {
    status?: string
    category?: string
    ownerUserId?: string | null
  } = {}

  for (const rule of rules) {
    if (!ruleMatches(rule, ctx)) continue

    if (rule.setStatus?.trim()) updates.status = rule.setStatus.trim()
    if (rule.setCategory?.trim()) updates.category = rule.setCategory.trim()
    if (rule.setOwnerUserId?.trim()) {
      updates.ownerUserId = rule.setOwnerUserId.trim()
    }

    if (rule.taskTitle?.trim()) {
      const hours = typeof rule.taskDueHours === 'number' && rule.taskDueHours > 0 ? rule.taskDueHours : 24
      const due = new Date(Date.now() + hours * 60 * 60 * 1000)
      await prisma.task.create({
        data: {
          contactId: ctx.contactId,
          title: rule.taskTitle.trim(),
          description: (rule.taskDescription || '').trim() || null,
          priority: 'MEDIUM',
          dueDate: due,
          assignedTo: rule.taskAssigneeUserId?.trim() || null,
        },
      })
    }
  }

  if (Object.keys(updates).length > 0) {
    await prisma.contact.update({
      where: { id: ctx.contactId },
      data: updates as any,
    })
  }
}
