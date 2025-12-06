import { NextRequest, NextResponse } from 'next/server'

// Test endpoint that simulates the actual JotForm submission format
// Based on: https://form.jotform.com/253266939811163
export async function POST(request: NextRequest) {
  try {
    // Simulate JotForm webhook payload for the dental insurance form
    const testPayload = {
      formID: '253266939811163',
      submissionID: `test-${Date.now()}`,
      answers: [
        {
          id: '3',
          name: 'First Name',
          answer: 'John',
        },
        {
          id: '4',
          name: 'Last Name',
          answer: 'Doe',
        },
        {
          id: '5',
          name: 'Gender',
          answer: 'Male',
        },
        {
          id: '6',
          name: 'Date of birth?',
          answer: '1990-01-15',
        },
        {
          id: '7',
          name: 'Zip Code?',
          answer: '12345',
        },
        {
          id: '8',
          name: 'Phone Number',
          answer: '555-123-4567',
        },
        {
          id: '9',
          name: 'Email',
          answer: `test-${Date.now()}@example.com`,
        },
        {
          id: '10',
          name: 'Best time of day to reach you?',
          answer: 'Morning',
        },
        {
          id: '11',
          name: 'Level of dental work needed ?',
          answer: 'Moderate',
        },
        {
          id: '12',
          name: 'Replacing existing dental coverage?',
          answer: 'Yes',
        },
        {
          id: '13',
          name: 'Additional notes:',
          answer: 'Test submission from CRM',
        },
        {
          id: '14',
          name: 'Name of the dental office referring you?',
          answer: 'Test Dental Office',
        },
      ],
    }

    // Forward to actual webhook
    const webhookUrl = new URL('/api/webhooks/jotform', request.url)
    
    // Add QR code ID and referral code as URL params to simulate QR scan
    const qrCodeId = request.nextUrl.searchParams.get('qr_code_id') || 'test-qr-123'
    const referralCode = request.nextUrl.searchParams.get('referral_code')
    
    webhookUrl.searchParams.set('qr_code_id', qrCodeId)
    if (referralCode) {
      webhookUrl.searchParams.set('referral_code', referralCode)
    }

    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      testPayload,
      webhookResponse: result,
      message: 'Test form submission sent to webhook',
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to show test instructions
export async function GET() {
  return NextResponse.json({
    message: 'JotForm Test Endpoint',
    instructions: [
      'POST to this endpoint to test JotForm webhook',
      'Add ?qr_code_id=YOUR_QR_ID to test QR code tracking',
      'Add ?referral_code=YOUR_CODE to test referral tracking',
      'Example: POST /api/webhooks/jotform/test-form?qr_code_id=abc123&referral_code=REF001',
    ],
    testUrl: '/api/webhooks/jotform/test-form',
  })
}

