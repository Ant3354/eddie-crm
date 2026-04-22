import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import type { CrmSettingsShape, JotformFormRoute } from '@/lib/crm-settings'
import { getCrmSettings } from '@/lib/crm-settings'

function routesFromEnv(): JotformFormRoute[] {
  const routes: JotformFormRoute[] = []
  const dental = process.env.JOTFORM_FORM_ID_DENTAL?.trim()
  if (dental) {
    routes.push({
      id: 'env-dental',
      enabled: true,
      formId: dental,
      label: 'Dental office JotForm',
      tag: 'Dental Partner Lead',
      campaignName: 'Dental Partner Lead Sequence',
      setCategory: 'DENTAL_OFFICE_PARTNER',
      setStatus: 'LEAD',
      taskTitle: 'Follow up: dental partner lead',
      taskDescription: 'New submission from dental office intake form. Review and reach out.',
      taskDueHours: 24,
      notifyInternal: true,
    })
  }
  const clinic = process.env.JOTFORM_FORM_ID_CLINIC?.trim()
  if (clinic) {
    routes.push({
      id: 'env-clinic',
      enabled: true,
      formId: clinic,
      label: 'Clinic / health office JotForm',
      tag: 'Clinic Partner Lead',
      campaignName: 'Clinic Partner Lead Sequence',
      setCategory: 'HEALTH_OFFICE_PARTNER',
      setStatus: 'LEAD',
      taskTitle: 'Follow up: clinic partner lead',
      taskDescription: 'New submission from clinic intake form. Review and reach out.',
      taskDueHours: 24,
      notifyInternal: true,
    })
  }
  const client =
    process.env.JOTFORM_FORM_ID_CLIENT?.trim() ||
    process.env.JOTFORM_FORM_ID_CONSUMER?.trim() ||
    process.env.JOTFORM_FORM_ID?.trim()
  if (client) {
    routes.push({
      id: 'env-client',
      enabled: true,
      formId: client,
      label: 'Individual / client JotForm',
      tag: 'Individual Lead',
      campaignName: 'Individual Welcome Nurture',
      setCategory: 'CONSUMER',
      setStatus: 'LEAD',
      taskTitle: 'Follow up: new individual lead',
      taskDescription: 'New submission from personal/client intake. Welcome and qualify.',
      taskDueHours: 24,
      notifyInternal: true,
    })
  }
  return routes
}

/** Settings routes override env routes when the same `formId` appears in both (first match wins). */
export function mergeJotformFormRoutes(settings: CrmSettingsShape): JotformFormRoute[] {
  const fromSettings = (settings.jotformFormRoutes || []).filter((r) => r.enabled !== false && r.formId?.trim())
  const fromEnv = routesFromEnv()
  const byId = new Map<string, JotformFormRoute>()
  for (const r of fromEnv) {
    byId.set(String(r.formId).trim(), r)
  }
  for (const r of fromSettings) {
    byId.set(String(r.formId).trim(), r)
  }
  return Array.from(byId.values())
}

async function sendInternalIntakeNotification(params: {
  contactId: string
  title: string
  bodyHtml: string
}): Promise<void> {
  const to =
    process.env.INTERNAL_NOTIFY_EMAIL?.trim() ||
    (
      await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'MANAGER'] } },
        orderBy: { createdAt: 'asc' },
        select: { email: true },
      })
    )?.email
  if (!to) {
    await logAudit('INTERNAL_NOTIFY_SKIPPED', undefined, params.contactId, 'no_internal_email')
    return
  }
  try {
    const { sendEmail } = await import('@/lib/email')
    await sendEmail(to, params.title, params.bodyHtml, params.contactId)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await logAudit('INTERNAL_NOTIFY_FAILED', undefined, params.contactId, msg)
  }
}

async function enrollInCampaignByName(contactId: string, campaignName: string): Promise<boolean> {
  const name = campaignName.trim()
  if (!name) return false
  const campaign = await prisma.campaign.findFirst({
    where: { name, isActive: true },
  })
  if (!campaign) return false

  const existing = await prisma.campaignContact.findFirst({
    where: {
      contactId,
      campaignId: campaign.id,
      status: { in: ['PENDING', 'ACTIVE'] },
    },
  })
  if (existing) return true

  await prisma.campaignContact.create({
    data: {
      campaignId: campaign.id,
      contactId,
      status: 'ACTIVE',
      currentStep: 0,
    },
  })
  await logAudit('CAMPAIGN_ENROLLED', undefined, contactId, campaign.name)
  return true
}

/**
 * After JotForm ingest: tag, pipeline fields, campaign enrollment, follow-up task, internal email.
 */
export async function applyJotformFormRouting(params: {
  formId: string
  contactId: string
  contactName: string
  formLabel?: string
  verbose?: boolean
}): Promise<{ matched: boolean; route?: JotformFormRoute }> {
  const formId = params.formId?.trim()
  if (!formId) return { matched: false }

  const { settings } = await getCrmSettings()
  const routes = mergeJotformFormRoutes(settings)
  const route = routes.find((r) => String(r.formId).trim() === formId)
  if (!route) return { matched: false }

  const v = params.verbose
  if (v) console.log('🧭 JotForm form route matched:', route.label || route.id, formId)

  const update: { category?: string; status?: string } = {}
  if (route.setCategory?.trim()) update.category = route.setCategory.trim()
  if (route.setStatus?.trim()) update.status = route.setStatus.trim()
  if (Object.keys(update).length > 0) {
    await prisma.contact.update({
      where: { id: params.contactId },
      data: update as any,
    })
  }

  if (route.tag?.trim()) {
    await prisma.contactTag.upsert({
      where: {
        contactId_name: { contactId: params.contactId, name: route.tag.trim() },
      },
      create: { contactId: params.contactId, name: route.tag.trim() },
      update: {},
    })
  }

  if (route.campaignName?.trim()) {
    await enrollInCampaignByName(params.contactId, route.campaignName)
  }

  if (route.taskTitle?.trim()) {
    const hours =
      typeof route.taskDueHours === 'number' && route.taskDueHours > 0 ? route.taskDueHours : 24
    const due = new Date(Date.now() + hours * 60 * 60 * 1000)
    await prisma.task.create({
      data: {
        contactId: params.contactId,
        title: route.taskTitle.trim(),
        description: (route.taskDescription || '').trim() || null,
        priority: 'HIGH',
        dueDate: due,
        assignedTo: route.taskAssigneeUserId?.trim() || null,
      },
    })
  }

  if (route.notifyInternal !== false) {
    const base = process.env.NEXT_PUBLIC_APP_URL || ''
    const link = `${base.replace(/\/$/, '')}/contacts/${params.contactId}`
    const html = `
      <p><strong>New JotForm submission</strong></p>
      <p>Form: ${(route.label || route.formId).replace(/</g, '')}</p>
      <p>Contact: ${params.contactName.replace(/</g, '')}</p>
      <p><a href="${link}">Open in CRM</a></p>
    `
    await sendInternalIntakeNotification({
      contactId: params.contactId,
      title: `New lead: ${route.tag || route.label || 'JotForm'}`,
      bodyHtml: html,
    })
  }

  await logAudit('JOTFORM_FORM_ROUTE', undefined, params.contactId, route.id, undefined, route.formId)

  return { matched: true, route }
}
