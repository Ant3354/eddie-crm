import nodemailer from 'nodemailer'
import { prisma } from './prisma'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  contactId?: string
) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })

    // Log email
    await prisma.emailLog.create({
      data: {
        contactId,
        to,
        subject,
        content: html,
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    // Log failure
    await prisma.emailLog.create({
      data: {
        contactId,
        to,
        subject,
        content: html,
        status: 'FAILED',
        error: error.message,
      },
    })

    throw error
  }
}

export function getPortalRedirectEmailTemplate(
  contactName: string,
  portalLinks: {
    memberPortal?: string
    providerLookup?: string
    pharmacy?: string
    riderBenefits?: string
    supportPhone?: string
    supportChat?: string
    appointmentLink?: string
  },
  agentContact?: { name: string; email: string; phone: string }
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .button:hover { background-color: #0056b3; }
        .agent-block { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome, ${contactName}!</h1>
        <p>Access your member resources with one click:</p>
        
        ${portalLinks.memberPortal ? `<a href="${portalLinks.memberPortal}" class="button">Member Portal</a>` : ''}
        ${portalLinks.providerLookup ? `<a href="${portalLinks.providerLookup}" class="button">Provider Lookup</a>` : ''}
        ${portalLinks.pharmacy ? `<a href="${portalLinks.pharmacy}" class="button">Pharmacy</a>` : ''}
        ${portalLinks.riderBenefits ? `<a href="${portalLinks.riderBenefits}" class="button">Rider Benefits</a>` : ''}
        ${portalLinks.supportPhone ? `<a href="tel:${portalLinks.supportPhone}" class="button">Support Phone</a>` : ''}
        ${portalLinks.supportChat ? `<a href="${portalLinks.supportChat}" class="button">Support Chat</a>` : ''}
        ${portalLinks.appointmentLink ? `<a href="${portalLinks.appointmentLink}" class="button">Schedule Appointment</a>` : ''}
        
        ${agentContact ? `
          <div class="agent-block">
            <h3>Your Agent</h3>
            <p><strong>${agentContact.name}</strong></p>
            <p>Email: <a href="mailto:${agentContact.email}">${agentContact.email}</a></p>
            <p>Phone: <a href="tel:${agentContact.phone}">${agentContact.phone}</a></p>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
}

