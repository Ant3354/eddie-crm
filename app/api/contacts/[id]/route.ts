import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { encrypt } from '@/lib/encryption'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        tags: true,
        policies: true,
        tasks: true,
        files: true,
        campaigns: {
          include: {
            campaign: true,
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Get sensitive data if exists
    const sensitiveData = await prisma.sensitiveData.findUnique({
      where: { contactId: params.id },
    })

    await logAudit('CONTACT_VIEWED', undefined, params.id)

    return NextResponse.json({
      ...contact,
      sensitiveData: sensitiveData ? {
        dob: sensitiveData.dob, // Will be decrypted on frontend if needed
        ssn: sensitiveData.ssn, // Will be decrypted on frontend if needed
      } : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      mobilePhone,
      address,
      languagePreference,
      category,
      status,
      emailOptIn,
      smsOptIn,
      paymentIssueAlert,
      enrolledDate,
      renewalDate,
      dob,
      ssn,
    } = body

    // Get old contact for audit
    const oldContact = await prisma.contact.findUnique({
      where: { id: params.id },
    })

    const updateData: any = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (mobilePhone !== undefined) updateData.mobilePhone = mobilePhone
    if (address !== undefined) updateData.address = address
    if (languagePreference !== undefined) updateData.languagePreference = languagePreference
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (emailOptIn !== undefined) updateData.emailOptIn = emailOptIn
    if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn
    if (paymentIssueAlert !== undefined) {
      updateData.paymentIssueAlert = paymentIssueAlert
      
      // Handle payment alert toggle
      if (paymentIssueAlert && !oldContact?.paymentIssueAlert) {
        // Add red alert tag
        await prisma.contactTag.upsert({
          where: {
            contactId_name: {
              contactId: params.id,
              name: 'Red Alert: Payment',
            },
          },
          create: {
            contactId: params.id,
            name: 'Red Alert: Payment',
          },
          update: {},
        })

        // Start failed payment sequence
        const { startFailedPaymentSequence } = await import('@/lib/campaigns')
        await startFailedPaymentSequence(params.id)
      } else if (!paymentIssueAlert && oldContact?.paymentIssueAlert) {
        // Remove red alert tag
        await prisma.contactTag.deleteMany({
          where: {
            contactId: params.id,
            name: 'Red Alert: Payment',
          },
        })

        // Stop failed payment sequence
        const { stopFailedPaymentSequence } = await import('@/lib/campaigns')
        await stopFailedPaymentSequence(params.id)
      }
    }
    if (enrolledDate !== undefined) updateData.enrolledDate = enrolledDate ? new Date(enrolledDate) : null
    if (renewalDate !== undefined) updateData.renewalDate = renewalDate ? new Date(renewalDate) : null

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: updateData,
    })

    // Handle sensitive data
    if (dob !== undefined || ssn !== undefined) {
      const sensitiveUpdate: any = {}
      if (dob !== undefined) sensitiveUpdate.dob = dob ? encrypt(dob) : null
      if (ssn !== undefined) sensitiveUpdate.ssn = ssn ? encrypt(ssn) : null

      await prisma.sensitiveData.upsert({
        where: { contactId: params.id },
        create: {
          contactId: params.id,
          ...sensitiveUpdate,
        },
        update: sensitiveUpdate,
      })

      await logAudit('SENSITIVE_DATA_UPDATED', undefined, params.id, 'DOB/SSN')
    }

    // Log field changes
    if (oldContact) {
      for (const [key, value] of Object.entries(updateData)) {
        const oldValue = (oldContact as any)[key]
        if (oldValue !== value) {
          await logAudit('CONTACT_UPDATED', undefined, params.id, key, String(oldValue), String(value))
        }
      }
    }

    return NextResponse.json(contact)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

