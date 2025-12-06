import { prisma } from './prisma'

// Test email function that doesn't require SMTP credentials
export async function sendTestEmail(
  to: string,
  subject: string,
  html: string,
  contactId?: string
): Promise<{ success: boolean; testMode?: boolean; message?: string; messageId?: string }> {
  // If SMTP is not configured, just log it
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
    console.log('📧 TEST EMAIL (SMTP not configured):')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Content:', html.substring(0, 200) + '...')
    
    // Log to database anyway
    await prisma.emailLog.create({
      data: {
        contactId,
        to,
        subject,
        content: html,
        status: 'PENDING',
        error: 'SMTP not configured - email not sent',
      },
    })

    return { success: true, testMode: true, message: 'Email logged (SMTP not configured)' }
  }

  // If SMTP is configured, use real email
  const { sendEmail } = await import('./email')
  return await sendEmail(to, subject, html, contactId)
}

