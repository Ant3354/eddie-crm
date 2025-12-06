import { prisma } from './prisma'
import { sendTestEmail } from './email-test'
import { sendTestSMS } from './sms-test'
import { addDays, isAfter, differenceInDays, subDays } from 'date-fns'
import { replaceTemplateVariables } from './template-variables'

export async function processCampaigns() {
  // Get all active campaign contacts
  const activeCampaigns = await prisma.campaignContact.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      campaign: {
        include: {
          steps: {
            orderBy: {
              stepOrder: 'asc',
            },
          },
        },
      },
      contact: {
        include: {
          referralLink: true,
        },
      },
    },
  })

  for (const campaignContact of activeCampaigns) {
    const { campaign, contact, currentStep } = campaignContact
    
    if (currentStep >= campaign.steps.length) {
      // Campaign completed
      await prisma.campaignContact.update({
        where: { id: campaignContact.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
      continue
    }

    const step = campaign.steps[currentStep]
    const shouldTrigger = await shouldTriggerStep(
      contact,
      step,
      campaignContact.lastSentAt
    )

    if (shouldTrigger) {
      // For referral campaigns, check click tracking before creating task
      if (campaign.type === 'REFERRAL_DRIP' && step.channel === 'TASK') {
        const referralLink = contact.referralLink
        const clickCount = referralLink?.clickCount || 0
        
        // Only create task if no clicks after 2 email/SMS attempts
        // Count how many email/SMS steps were sent before this task
        const previousSteps = campaign.steps.slice(0, currentStep)
        const emailSmsSteps = previousSteps.filter(s => s.channel === 'EMAIL' || s.channel === 'SMS')
        
        if (clickCount > 0 || emailSmsSteps.length < 2) {
          // Skip task creation - either has clicks or not enough attempts yet
          await prisma.campaignContact.update({
            where: { id: campaignContact.id },
            data: {
              currentStep: currentStep + 1,
              lastSentAt: new Date(),
            },
          })
          continue
        }
      }
      
      await executeCampaignStep(contact, step, campaignContact.id)
      
      await prisma.campaignContact.update({
        where: { id: campaignContact.id },
        data: {
          currentStep: currentStep + 1,
          lastSentAt: new Date(),
        },
      })
    }
  }
}

async function shouldTriggerStep(
  contact: any,
  step: any,
  lastSentAt: Date | null
): Promise<boolean> {
  if (!step.triggerDays && step.triggerDays !== 0) return true

  // Check for renewal-based triggers (negative days = before renewal)
  if (step.triggerDays < 0 && contact.renewalDate) {
    const triggerDate = addDays(contact.renewalDate, step.triggerDays)
    const now = new Date()
    if (lastSentAt) return false
    return isAfter(now, triggerDate) || differenceInDays(now, triggerDate) <= 1
  }

  // Enrollment-based triggers
  if (!contact.enrolledDate) return false

  const triggerDate = addDays(contact.enrolledDate, step.triggerDays)
  const now = new Date()

  if (lastSentAt) {
    // Don't send if we already sent this step
    return false
  }

  return isAfter(now, triggerDate) || differenceInDays(now, triggerDate) <= 1
}

async function executeCampaignStep(
  contact: any,
  step: any,
  campaignContactId: string
) {
  // Replace template variables
  const processedContent = await replaceTemplateVariables(step.content, contact.id)
  const processedSubject = step.subject 
    ? await replaceTemplateVariables(step.subject, contact.id)
    : 'Update'

  if (step.channel === 'EMAIL' && contact.email && contact.emailOptIn) {
    await sendTestEmail(contact.email, processedSubject, processedContent, contact.id)
  } else if (step.channel === 'SMS' && contact.mobilePhone && contact.smsOptIn) {
    await sendTestSMS(contact.mobilePhone, processedContent, contact.id)
  } else if (step.channel === 'TASK') {
    // Check if this is Day 10 escalation - set priority to URGENT
    const priority = step.subject?.includes('URGENT') || step.subject?.includes('Escalate') 
      ? 'URGENT' 
      : step.subject?.includes('Call Client') 
      ? 'HIGH' 
      : 'MEDIUM'
    
    await prisma.task.create({
      data: {
        contactId: contact.id,
        title: processedSubject,
        description: processedContent,
        priority,
        dueDate: addDays(new Date(), 1),
      },
    })
  }
}

export async function startFailedPaymentSequence(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      policies: {
        where: {
          paymentStatus: 'FAILED',
        },
      },
    },
  })

  if (!contact || !contact.paymentIssueAlert) return

  // Check if already in failed payment campaign
  const existingCampaign = await prisma.campaignContact.findFirst({
    where: {
      contactId,
      campaign: {
        type: 'FAILED_PAYMENT',
      },
      status: {
        in: ['PENDING', 'ACTIVE'],
      },
    },
  })

  if (existingCampaign) return

  // Find or create failed payment campaign
  let campaign = await prisma.campaign.findFirst({
    where: {
      type: 'FAILED_PAYMENT',
      isActive: true,
    },
  })

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'Failed Payment Rescue',
        type: 'FAILED_PAYMENT',
        category: 'CONSUMER',
        isActive: true,
        steps: {
          create: [
            {
              stepOrder: 0,
              triggerDays: 0,
              channel: 'SMS',
              subject: 'Payment Reminder',
              content: 'Hi, we noticed a payment issue. Please update your payment method: [PAYMENT_LINK]. Reply if you need help.',
            },
            {
              stepOrder: 1,
              triggerDays: 0,
              channel: 'EMAIL',
              subject: 'Payment Update Required',
              content: 'We need to update your payment method. Click here: [PAYMENT_LINK]',
            },
            {
              stepOrder: 2,
              triggerDays: 3,
              channel: 'SMS',
              subject: 'Follow-up: Payment Reminder',
              content: 'Friendly reminder about your payment. Update here: [PAYMENT_LINK]',
            },
            {
              stepOrder: 3,
              triggerDays: 3,
              channel: 'EMAIL',
              subject: 'Follow-up: Payment Update',
              content: 'Please update your payment method: [PAYMENT_LINK]',
            },
            {
              stepOrder: 4,
              triggerDays: 7,
              channel: 'SMS',
              subject: 'Final Payment Reminder',
              content: 'Final reminder: Please update your payment to avoid service interruption. [PAYMENT_LINK]',
            },
            {
              stepOrder: 5,
              triggerDays: 7,
              channel: 'EMAIL',
              subject: 'Final Payment Reminder',
              content: 'Final reminder: Update your payment method: [PAYMENT_LINK]',
            },
            {
              stepOrder: 6,
              triggerDays: 7,
              channel: 'TASK',
              subject: 'Call Client - Payment Issue',
              content: 'Client has not responded to payment reminders. Please call to resolve.',
            },
            {
              stepOrder: 7,
              triggerDays: 10,
              channel: 'TASK',
              subject: 'URGENT: Escalate Payment Issue',
              content: 'Client has not responded after 10 days. ESCALATE PRIORITY and call immediately.',
            },
          ],
        },
      },
    })
  }

  // Add contact to campaign
  await prisma.campaignContact.create({
    data: {
      campaignId: campaign.id,
      contactId,
      status: 'ACTIVE',
      currentStep: 0,
    },
  })
}

export async function stopFailedPaymentSequence(contactId: string) {
  await prisma.campaignContact.updateMany({
    where: {
      contactId,
      campaign: {
        type: 'FAILED_PAYMENT',
      },
      status: {
        in: ['PENDING', 'ACTIVE'],
      },
    },
    data: {
      status: 'CANCELLED',
    },
  })
}

