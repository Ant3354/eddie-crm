import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test endpoint to verify JotForm webhook is working
export async function GET(request: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobilePhone: true,
        createdAt: true,
        category: true,
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'JotForm webhook endpoint is accessible',
      recentContacts: contacts,
      totalContacts: await prisma.contact.count(),
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/webhooks/jotform`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: 'Error checking webhook status'
      },
      { status: 500 }
    )
  }
}

// Test POST to simulate JotForm submission
export async function POST(request: NextRequest) {
  try {
    const testData = {
      formData: {
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@example.com`,
        phone: '555-1234',
        language: 'English',
        interestType: 'Consumer',
      },
    }

    // Forward to actual webhook
    const webhookUrl = new URL('/api/webhooks/jotform', request.url)
    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      testData,
      webhookResponse: result,
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

