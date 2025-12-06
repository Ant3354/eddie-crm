import twilio from 'twilio'
import { prisma } from './prisma'

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  if (!accountSid || !authToken || !accountSid.startsWith('AC')) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env')
  }
  
  return twilio(accountSid, authToken)
}

export async function sendSMS(
  to: string,
  message: string,
  contactId?: string
) {
  try {
    const client = getTwilioClient()
    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured')
    }
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    })

    // Log SMS
    await prisma.smsLog.create({
      data: {
        contactId,
        to,
        message,
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return { success: true, sid: result.sid }
  } catch (error: any) {
    // Log failure
    await prisma.smsLog.create({
      data: {
        contactId,
        to,
        message,
        status: 'FAILED',
        error: error.message,
      },
    })

    throw error
  }
}

