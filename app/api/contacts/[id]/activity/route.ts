import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activities: any[] = []

    // Get emails
    const emails = await prisma.emailLog.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    emails.forEach((email) => {
      activities.push({
        id: email.id,
        type: 'EMAIL',
        title: email.subject,
        description: email.status === 'SENT' ? 'Email sent' : `Email ${email.status.toLowerCase()}`,
        timestamp: email.sentAt || email.createdAt,
        metadata: { to: email.to, status: email.status },
      })
    })

    // Get SMS
    const sms = await prisma.smsLog.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    sms.forEach((smsItem) => {
      activities.push({
        id: smsItem.id,
        type: 'SMS',
        title: 'SMS Message',
        description: smsItem.status === 'SENT' ? 'SMS sent' : `SMS ${smsItem.status.toLowerCase()}`,
        timestamp: smsItem.sentAt || smsItem.createdAt,
        metadata: { to: smsItem.to, status: smsItem.status },
      })
    })

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    tasks.forEach((task) => {
      activities.push({
        id: task.id,
        type: 'TASK',
        title: task.title,
        description: task.description || '',
        timestamp: task.createdAt,
        metadata: { status: task.status, priority: task.priority },
      })
    })

    // Get campaign activities
    const campaignContacts = await prisma.campaignContact.findMany({
      where: { contactId: params.id },
      include: { campaign: true },
    })
    campaignContacts.forEach((cc) => {
      activities.push({
        id: cc.id,
        type: 'CAMPAIGN',
        title: `Campaign: ${cc.campaign.name}`,
        description: `Status: ${cc.status}`,
        timestamp: cc.createdAt,
        metadata: { campaignId: cc.campaignId, status: cc.status },
      })
    })

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    auditLogs.forEach((log) => {
      activities.push({
        id: log.id,
        type: 'AUDIT',
        title: log.action,
        description: log.fieldName ? `${log.fieldName}: ${log.oldValue} → ${log.newValue}` : log.action,
        timestamp: log.createdAt,
        metadata: { action: log.action, fieldName: log.fieldName },
      })
    })

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(activities)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

