import { prisma } from './prisma'

// Test SMS function that doesn't require Twilio credentials
export async function sendTestSMS(
  to: string,
  message: string,
  contactId?: string
): Promise<{ success: boolean; testMode?: boolean; message?: string; sid?: string }> {
  // If Twilio is not configured, just log it
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC') || process.env.TWILIO_ACCOUNT_SID === 'your-account-sid') {
    console.log('📱 TEST SMS (Twilio not configured):')
    console.log('To:', to)
    console.log('Message:', message)
    
    // Log to database anyway
    await prisma.smsLog.create({
      data: {
        contactId,
        to,
        message,
        status: 'PENDING',
        error: 'Twilio not configured - SMS not sent',
      },
    })

    return { success: true, testMode: true, message: 'SMS logged (Twilio not configured)' }
  }

  // If Twilio is configured, use real SMS
  const { sendSMS } = await import('./sms')
  return await sendSMS(to, message, contactId)
}

