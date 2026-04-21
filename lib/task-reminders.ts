import { prisma } from '@/lib/prisma'
import { getCrmSettings } from '@/lib/crm-settings'
import { sendTestEmail } from '@/lib/email-test'
import { sendTestSMS } from '@/lib/sms-test'

export type TaskReminderRunResult = {
  checked: number
  emailed: number
  smsed: number
  skipped: number
  errors: string[]
}

function formatDue(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return 'soon'
  return d.toLocaleString()
}

/**
 * Pending tasks with a due date within the next `hoursBeforeDue` window,
 * no reminder sent yet. Sends one email and/or SMS per task if contact opted in.
 */
export async function processTaskDueReminders(): Promise<TaskReminderRunResult> {
  const { settings } = await getCrmSettings()
  const hours = settings.taskReminderHoursBeforeDue ?? 24
  const now = new Date()
  const horizon = new Date(now.getTime() + hours * 60 * 60 * 1000)

  const tasks = await prisma.task.findMany({
    where: {
      status: 'PENDING',
      reminderSentAt: null,
      dueDate: { not: null, lte: horizon, gte: now },
    },
    include: {
      contact: true,
    },
    take: 200,
  })

  const result: TaskReminderRunResult = {
    checked: tasks.length,
    emailed: 0,
    smsed: 0,
    skipped: 0,
    errors: [],
  }

  for (const task of tasks) {
    const c = task.contact
    if (!c) {
      result.skipped++
      continue
    }

    let sentAny = false

    if (c.email && c.emailOptIn) {
      try {
        const subject = `Reminder: ${task.title}`
        const html = `<p>Hi ${c.firstName},</p><p>This is a friendly reminder about your task: <strong>${task.title}</strong>.</p><p>Due: ${formatDue(task.dueDate)}</p>${task.description ? `<p>${task.description}</p>` : ''}`
        await sendTestEmail(c.email, subject, html, c.id)
        result.emailed++
        sentAny = true
      } catch (e) {
        result.errors.push(`${task.id} email: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (c.mobilePhone && c.smsOptIn) {
      try {
        const msg = `EDDIE CRM reminder: "${task.title}" due ${formatDue(task.dueDate)}. Reply if you need to reschedule.`
        await sendTestSMS(c.mobilePhone, msg, c.id)
        result.smsed++
        sentAny = true
      } catch (e) {
        result.errors.push(`${task.id} sms: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (sentAny) {
      await prisma.task.update({
        where: { id: task.id },
        data: { reminderSentAt: new Date() },
      })
    } else {
      result.skipped++
    }
  }

  return result
}
