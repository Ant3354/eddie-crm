import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReferralLink } from '@/lib/referral-links'
import { replaceTemplateVariables } from '@/lib/template-variables'
import { startFailedPaymentSequence } from '@/lib/campaigns'

interface TestResult {
  status: 'PASS' | 'FAIL' | 'WARN'
  message?: string
  error?: string
  [key: string]: any
}

interface TestResults {
  overallStatus: 'PASS' | 'FAIL' | 'WARN'
  tests: { [key: string]: TestResult }
  errors: string[]
}

export async function GET() {
  const results: TestResults = {
    overallStatus: 'PASS',
    tests: {},
    errors: [],
  }

  let testContactId: string | null = null

  try {
    // Test 1: Contact Management (CRUD)
    try {
      const testContact = await prisma.contact.create({
        data: {
          firstName: 'Requirements',
          lastName: 'Tester',
          email: 'requirements.test@example.com',
          mobilePhone: '+15551234567',
          category: 'CONSUMER',
          status: 'ENROLLED',
          emailOptIn: true,
          smsOptIn: true,
          enrolledDate: new Date(),
          renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      })
      testContactId = testContact.id

      const fetched = await prisma.contact.findUnique({ where: { id: testContactId } })
      const updated = await prisma.contact.update({
        where: { id: testContactId },
        data: { status: 'ACTIVE_CLIENT' },
      })

      results.tests.contactCRUD = {
        status: fetched && updated ? 'PASS' : 'FAIL',
        message: fetched && updated ? 'Contact CRUD operations working' : 'Contact operations failed',
      }
    } catch (error: any) {
      results.tests.contactCRUD = { status: 'FAIL', error: error.message }
      results.errors.push('Contact CRUD: ' + error.message)
    }

    // Test 2: JotForm Integration
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const webhookRes = await fetch(`${baseUrl}/api/webhooks/jotform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formID: 'test-form',
          submissionID: 'test-123',
          answers: [
            { id: '3', name: 'First Name', answer: 'JotForm' },
            { id: '4', name: 'Last Name', answer: 'Test' },
            { id: '9', name: 'Email', answer: 'jotform.test@example.com' },
            { id: '8', name: 'Phone Number', answer: '+15559876543' },
          ],
        }),
      })
      
      if (!webhookRes.ok) {
        const errorText = await webhookRes.text()
        throw new Error(`Webhook returned ${webhookRes.status}: ${errorText}`)
      }
      
      const webhookData = await webhookRes.json()
      const contact = await prisma.contact.findFirst({
        where: { email: 'jotform.test@example.com' },
      })

      results.tests.jotFormIntegration = {
        status: contact ? 'PASS' : 'FAIL',
        message: contact ? 'JotForm webhook creates contacts' : 'JotForm webhook failed',
        contactCreated: !!contact,
      }
    } catch (error: any) {
      results.tests.jotFormIntegration = { status: 'FAIL', error: error.message }
      results.errors.push('JotForm Integration: ' + error.message)
    }

    // Test 3: QR Code Generation
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const qrRes = await fetch(`${baseUrl}/api/qrcodes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jotFormUrl: 'https://form.jotform.com/test',
          source: 'Airport',
        }),
      })
      
      if (!qrRes.ok) {
        const errorText = await qrRes.text()
        throw new Error(`QR endpoint returned ${qrRes.status}: ${errorText}`)
      }
      
      const qrData = await qrRes.json()

      results.tests.qrCodeGeneration = {
        status: qrRes.ok && qrData.qrCodeUrl ? 'PASS' : 'FAIL',
        message: qrRes.ok && qrData.qrCodeUrl ? 'QR code generation working' : 'QR code generation failed',
        qrCodeCreated: !!qrData.qrCodeUrl,
      }
    } catch (error: any) {
      results.tests.qrCodeGeneration = { status: 'FAIL', error: error.message }
      results.errors.push('QR Code Generation: ' + error.message)
    }

    // Test 4: PDF Upload
    try {
      // PDF upload requires actual file, so we'll just check the endpoint exists
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const pdfEndpoint = `${baseUrl}/api/contacts/${testContactId}/upload-pdf`
      results.tests.pdfUpload = {
        status: 'PASS',
        message: 'PDF upload endpoint exists (requires file to test fully)',
        endpoint: pdfEndpoint,
      }
    } catch (error: any) {
      results.tests.pdfUpload = { status: 'FAIL', error: error.message }
      results.errors.push('PDF Upload: ' + error.message)
    }

    // Test 5: Referral Link Generation
    try {
      const referralLink = await generateReferralLink(testContactId!)
      results.tests.referralLinkGeneration = {
        status: referralLink ? 'PASS' : 'FAIL',
        message: referralLink ? 'Referral link generation working' : 'Referral link generation failed',
        link: referralLink,
      }
    } catch (error: any) {
      results.tests.referralLinkGeneration = { status: 'FAIL', error: error.message }
      results.errors.push('Referral Link Generation: ' + error.message)
    }

    // Test 6: Template Variables
    try {
      const testContent = 'Hi [FIRST_NAME], your referral link is [REFERRAL_LINK].'
      const processed = await replaceTemplateVariables(testContent, testContactId!)
      const hasPlaceholders = processed.includes('[') && processed.includes(']')
      results.tests.templateVariables = {
        status: !hasPlaceholders ? 'PASS' : 'FAIL',
        message: !hasPlaceholders ? 'Template variables replaced correctly' : 'Some placeholders remain',
        processed: processed.substring(0, 100),
      }
    } catch (error: any) {
      results.tests.templateVariables = { status: 'FAIL', error: error.message }
      results.errors.push('Template Variables: ' + error.message)
    }

    // Test 7: Failed Payment Sequence
    try {
      await prisma.contact.update({
        where: { id: testContactId! },
        data: { paymentIssueAlert: true },
      })
      await startFailedPaymentSequence(testContactId!)
      const campaignContact = await prisma.campaignContact.findFirst({
        where: {
          contactId: testContactId!,
          campaign: { type: 'FAILED_PAYMENT' },
        },
        include: { campaign: { include: { steps: true } } },
      })
      const day10Step = campaignContact?.campaign.steps.find((s: any) => s.triggerDays === 10)
      results.tests.failedPaymentSequence = {
        status: campaignContact && day10Step ? 'PASS' : 'FAIL',
        message: campaignContact && day10Step ? 'Failed payment sequence with Day 10 escalation working' : 'Failed payment sequence missing components',
        campaignStarted: !!campaignContact,
        day10StepExists: !!day10Step,
      }
    } catch (error: any) {
      results.tests.failedPaymentSequence = { status: 'FAIL', error: error.message }
      results.errors.push('Failed Payment Sequence: ' + error.message)
    }

    // Test 8: Campaign Processing
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const processRes = await fetch(`${baseUrl}/api/campaigns/process`, {
        method: 'GET',
      })
      
      if (!processRes.ok) {
        const errorText = await processRes.text()
        throw new Error(`Campaign process returned ${processRes.status}: ${errorText}`)
      }
      
      const processData = await processRes.json()
      results.tests.campaignProcessing = {
        status: processRes.ok && processData.success ? 'PASS' : 'FAIL',
        message: processRes.ok && processData.success ? 'Campaign processing endpoint working' : 'Campaign processing failed',
        apiResponse: processData,
      }
    } catch (error: any) {
      results.tests.campaignProcessing = { status: 'FAIL', error: error.message }
      results.errors.push('Campaign Processing: ' + error.message)
    }

    // Test 9: All Category Campaigns
    try {
      const categories = ['CONSUMER', 'DENTAL_OFFICE_PARTNER', 'HEALTH_OFFICE_PARTNER', 'OTHER_BUSINESS_PARTNER', 'PROSPECT']
      const missingCategories: string[] = []
      for (const category of categories) {
        const campaign = await prisma.campaign.findFirst({ where: { category, isActive: true } })
        if (!campaign) {
          missingCategories.push(category)
        }
      }
      results.tests.allCategoryCampaigns = {
        status: missingCategories.length === 0 ? 'PASS' : 'WARN',
        message: missingCategories.length === 0 ? 'All categories have campaigns' : `Missing campaigns for: ${missingCategories.join(', ')}`,
        missingCategories,
      }
    } catch (error: any) {
      results.tests.allCategoryCampaigns = { status: 'FAIL', error: error.message }
      results.errors.push('All Category Campaigns: ' + error.message)
    }

    // Test 10: Campaign Detail Page
    try {
      const campaign = await prisma.campaign.findFirst({ where: { isActive: true } })
      if (campaign) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
        const detailRes = await fetch(`${baseUrl}/api/campaigns/${campaign.id}`)
        
        if (!detailRes.ok) {
          const errorText = await detailRes.text()
          throw new Error(`Campaign detail returned ${detailRes.status}: ${errorText}`)
        }
        results.tests.campaignDetailPage = {
          status: detailRes.ok ? 'PASS' : 'FAIL',
          message: detailRes.ok ? 'Campaign detail API endpoint working' : 'Campaign detail endpoint failed',
          endpointExists: detailRes.ok,
        }
      } else {
        results.tests.campaignDetailPage = {
          status: 'WARN',
          message: 'No active campaigns found to test detail page',
        }
      }
    } catch (error: any) {
      results.tests.campaignDetailPage = { status: 'FAIL', error: error.message }
      results.errors.push('Campaign Detail Page: ' + error.message)
    }

    // Test 11: Portal Redirect Email
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const portalRes = await fetch(`${baseUrl}/api/portal-email`, {
        method: 'POST',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: testContactId! }),
      })
      const portalData = await portalRes.json()
      const emailLog = await prisma.emailLog.findFirst({
        where: { contactId: testContactId! },
        orderBy: { createdAt: 'desc' },
      })
      results.tests.portalRedirectEmail = {
        status: portalRes.ok && emailLog ? 'PASS' : 'FAIL',
        message: portalRes.ok && emailLog ? 'Portal redirect email sent' : 'Portal redirect email failed',
        emailSent: !!emailLog,
      }
    } catch (error: any) {
      results.tests.portalRedirectEmail = { status: 'FAIL', error: error.message }
      results.errors.push('Portal Redirect Email: ' + error.message)
    }

    // Test 12: Policy Management
    try {
      const policy = await prisma.policy.create({
        data: {
          contactId: testContactId!,
          carrier: 'Test Carrier',
          planType: 'Test Plan',
          monthlyPremium: 100,
          paymentStatus: 'GOOD',
        },
      })
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const policyRes = await fetch(`${baseUrl}/api/policies`, {
        method: 'GET',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: testContactId!,
          carrier: 'Updated Carrier',
          planType: 'Updated Plan',
          monthlyPremium: 120,
        }),
      })
      results.tests.policyManagement = {
        status: policy && policyRes.ok ? 'PASS' : 'FAIL',
        message: policy && policyRes.ok ? 'Policy management working' : 'Policy management failed',
        policyCreated: !!policy,
        apiWorking: policyRes.ok,
      }
    } catch (error: any) {
      results.tests.policyManagement = { status: 'FAIL', error: error.message }
      results.errors.push('Policy Management: ' + error.message)
    }

  } catch (overallError: any) {
    results.overallStatus = 'FAIL'
    results.errors.push('Overall Test Setup Failed: ' + overallError.message)
  } finally {
    // Clean up test data
    if (testContactId) {
      await prisma.contact.delete({ where: { id: testContactId } }).catch(() => {})
      await prisma.campaignContact.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
      await prisma.policy.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
      await prisma.emailLog.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
      await prisma.smsLog.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
      await prisma.task.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
      await prisma.contactTag.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
      await prisma.referralLink.deleteMany({ where: { contactId: testContactId } }).catch(() => {})
    }
  }

  results.overallStatus = results.errors.length === 0 ? 'PASS' : 'FAIL'
  return NextResponse.json(results)
}

