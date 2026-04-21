import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get recent notifications (payment alerts, overdue tasks, etc.)
    const paymentAlerts = await prisma.contact.count({
      where: { paymentIssueAlert: true },
    })

    const overdueTasks = await prisma.task.count({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
    })

    const urgentTasks = await prisma.task.count({
      where: {
        status: 'PENDING',
        priority: 'URGENT',
      },
    })

    const since = new Date(Date.now() - 72 * 60 * 60 * 1000)
    const recentJotformLeads = await prisma.auditLog.count({
      where: {
        action: 'JOTFORM_SUBMISSION',
        createdAt: { gte: since },
      },
    })

    const notifications = []
    
    if (paymentAlerts > 0) {
      notifications.push({
        id: 'payment-alerts',
        type: 'alert',
        title: `${paymentAlerts} Payment Alert${paymentAlerts > 1 ? 's' : ''}`,
        message: `${paymentAlerts} contact${paymentAlerts > 1 ? 's have' : ' has'} payment issues requiring attention`,
        link: '/contacts?paymentAlert=true',
        count: paymentAlerts,
      })
    }

    if (overdueTasks > 0) {
      notifications.push({
        id: 'overdue-tasks',
        type: 'warning',
        title: `${overdueTasks} Overdue Task${overdueTasks > 1 ? 's' : ''}`,
        message: `${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} past due date`,
        link: '/tasks',
        count: overdueTasks,
      })
    }

    if (urgentTasks > 0) {
      notifications.push({
        id: 'urgent-tasks',
        type: 'urgent',
        title: `${urgentTasks} Urgent Task${urgentTasks > 1 ? 's' : ''}`,
        message: `${urgentTasks} urgent task${urgentTasks > 1 ? 's require' : ' requires'} immediate attention`,
        link: '/tasks?priority=URGENT',
        count: urgentTasks,
      })
    }

    if (recentJotformLeads > 0) {
      notifications.push({
        id: 'jotform-leads',
        type: 'info',
        title: `${recentJotformLeads} JotForm lead${recentJotformLeads > 1 ? 's' : ''} (72h)`,
        message: `New or updated contacts from JotForm in the last 72 hours`,
        link: '/contacts',
        count: recentJotformLeads,
      })
    }

    return NextResponse.json({ notifications, unreadCount: notifications.length })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

