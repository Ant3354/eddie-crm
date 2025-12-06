import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTestEmail } from '@/lib/email-test'
import { sendTestSMS } from '@/lib/sms-test'
import { generateReferralLink } from '@/lib/referral-links'
import { generateQRCode } from '@/lib/qrcode'

// Comprehensive test endpoint
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  }

  try {
    // Test 1: Database Connection
    try {
      const contactCount = await prisma.contact.count()
      results.tests.database = { status: 'PASS', message: `Connected. ${contactCount} contacts found.` }
    } catch (error: any) {
      results.tests.database = { status: 'FAIL', error: error.message }
      results.errors.push('Database: ' + error.message)
    }

    // Test 2: Create Test Contact
    try {
      const testContact = await prisma.contact.create({
        data: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          mobilePhone: '+1234567890',
          category: 'CONSUMER',
          status: 'ACTIVE_CLIENT',
          emailOptIn: true,
          smsOptIn: true,
          enrolledDate: new Date(),
        },
      })
      results.tests.createContact = { status: 'PASS', contactId: testContact.id }
      
      // Test 3: Email Sending
      try {
        const emailResult = await sendTestEmail(
          testContact.email!,
          'Test Email',
          '<h1>Test Email</h1><p>This is a test email from EDDIE CRM.</p>',
          testContact.id
        )
        results.tests.sendEmail = { 
          status: 'PASS', 
          testMode: (emailResult as any).testMode || false,
          message: (emailResult as any).message || 'Email sent'
        }
      } catch (error: any) {
        results.tests.sendEmail = { status: 'FAIL', error: error.message }
        results.errors.push('Email: ' + error.message)
      }

      // Test 4: SMS Sending
      try {
        const smsResult = await sendTestSMS(
          testContact.mobilePhone!,
          'Test SMS from EDDIE CRM',
          testContact.id
        )
        results.tests.sendSMS = { 
          status: 'PASS',
          testMode: (smsResult as any).testMode || false,
          message: (smsResult as any).message || 'SMS sent'
        }
      } catch (error: any) {
        results.tests.sendSMS = { status: 'FAIL', error: error.message }
        results.errors.push('SMS: ' + error.message)
      }

      // Test 5: Referral Link Generation
      try {
        const referralLink = await generateReferralLink(testContact.id)
        results.tests.generateReferralLink = { status: 'PASS', referralLink }
      } catch (error: any) {
        results.tests.generateReferralLink = { status: 'FAIL', error: error.message }
        results.errors.push('Referral Link: ' + error.message)
      }

      // Test 6: QR Code Generation
      try {
        const qrResult = await generateQRCode('https://form.jotform.com/test', 'Test Source')
        results.tests.generateQRCode = { status: 'PASS', qrCodeUrl: qrResult.qrCodeUrl }
      } catch (error: any) {
        results.tests.generateQRCode = { status: 'FAIL', error: error.message }
        results.errors.push('QR Code: ' + error.message)
      }

      // Test 7: Campaign Creation
      try {
        const testCampaign = await prisma.campaign.create({
          data: {
            name: 'Test Campaign',
            description: 'Test campaign for validation',
            category: 'CONSUMER',
            type: 'CUSTOM',
            isActive: true,
            steps: {
              create: [
                {
                  stepOrder: 0,
                  triggerDays: 0,
                  channel: 'EMAIL',
                  subject: 'Test Email',
                  content: 'This is a test campaign step.',
                },
              ],
            },
          },
        })
        results.tests.createCampaign = { status: 'PASS', campaignId: testCampaign.id }
        
        // Clean up test campaign
        await prisma.campaign.delete({ where: { id: testCampaign.id } })
      } catch (error: any) {
        results.tests.createCampaign = { status: 'FAIL', error: error.message }
        results.errors.push('Campaign: ' + error.message)
      }

      // Test 8: Task Creation
      try {
        const testTask = await prisma.task.create({
          data: {
            contactId: testContact.id,
            title: 'Test Task',
            description: 'This is a test task',
            priority: 'MEDIUM',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        })
        results.tests.createTask = { status: 'PASS', taskId: testTask.id }
      } catch (error: any) {
        results.tests.createTask = { status: 'FAIL', error: error.message }
        results.errors.push('Task: ' + error.message)
      }

      // Clean up test contact
      await prisma.contact.delete({ where: { id: testContact.id } })
      results.tests.cleanup = { status: 'PASS', message: 'Test data cleaned up' }

    } catch (error: any) {
      results.tests.createContact = { status: 'FAIL', error: error.message }
      results.errors.push('Create Contact: ' + error.message)
    }

    // Test 9: Dashboard Stats
    try {
      const [contacts, campaigns, tasks] = await Promise.all([
        prisma.contact.count(),
        prisma.campaign.count(),
        prisma.task.count(),
      ])
      results.tests.dashboardStats = { 
        status: 'PASS', 
        contacts, 
        campaigns, 
        tasks 
      }
    } catch (error: any) {
      results.tests.dashboardStats = { status: 'FAIL', error: error.message }
      results.errors.push('Dashboard Stats: ' + error.message)
    }

    results.summary = {
      total: Object.keys(results.tests).length,
      passed: Object.values(results.tests).filter((t: any) => t.status === 'PASS').length,
      failed: Object.values(results.tests).filter((t: any) => t.status === 'FAIL').length,
    }

    return NextResponse.json(results, { status: results.errors.length > 0 ? 207 : 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, results },
      { status: 500 }
    )
  }
}

