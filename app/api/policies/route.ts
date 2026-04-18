import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTestEmail } from '@/lib/email-test'
import { getPortalRedirectEmailTemplate } from '@/lib/email'
import { getPublicAppOrigin } from '@/lib/app-origin'

/** Health / discovery — POST creates policies, PATCH updates (plan-change emails). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Policy API is running',
    usage: 'POST to create a policy; PATCH to update (triggers portal email on plan change when configured)',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactId, carrier, planType, monthlyPremium, effectiveDate, renewalDate, paymentStatus, memberPortalLink, pharmacyLink, riderBenefitsLink, beneficiaryInfo } = body

    const policy = await prisma.policy.create({
      data: {
        contactId,
        carrier,
        planType,
        monthlyPremium,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        paymentStatus: paymentStatus || 'GOOD',
        memberPortalLink,
        pharmacyLink,
        riderBenefitsLink,
        beneficiaryInfo,
      },
    })

    return NextResponse.json(policy)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, carrier, planType, monthlyPremium, effectiveDate, renewalDate, paymentStatus, memberPortalLink, pharmacyLink, riderBenefitsLink, beneficiaryInfo } = body

    // Get old policy to detect changes
    const oldPolicy = await prisma.policy.findUnique({
      where: { id },
      include: { contact: true },
    })

    if (!oldPolicy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (carrier !== undefined) updateData.carrier = carrier
    if (planType !== undefined) updateData.planType = planType
    if (monthlyPremium !== undefined) updateData.monthlyPremium = monthlyPremium
    if (effectiveDate !== undefined) updateData.effectiveDate = effectiveDate ? new Date(effectiveDate) : null
    if (renewalDate !== undefined) updateData.renewalDate = renewalDate ? new Date(renewalDate) : null
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (memberPortalLink !== undefined) updateData.memberPortalLink = memberPortalLink
    if (pharmacyLink !== undefined) updateData.pharmacyLink = pharmacyLink
    if (riderBenefitsLink !== undefined) updateData.riderBenefitsLink = riderBenefitsLink
    if (beneficiaryInfo !== undefined) updateData.beneficiaryInfo = beneficiaryInfo

    const policy = await prisma.policy.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    })

    // Detect plan change (carrier or planType changed)
    const planChanged = (carrier !== undefined && carrier !== oldPolicy.carrier) || 
                       (planType !== undefined && planType !== oldPolicy.planType)

    // Send portal email if plan changed and contact has email/opt-in
    if (planChanged && policy.contact && policy.contact.email && policy.contact.emailOptIn) {
      try {
        const portalLinks = {
          memberPortal: policy.memberPortalLink || undefined,
          pharmacy: policy.pharmacyLink || undefined,
          riderBenefits: policy.riderBenefitsLink || undefined,
          supportPhone: process.env.SUPPORT_PHONE,
          supportChat: process.env.SUPPORT_CHAT_URL,
          appointmentLink: `${getPublicAppOrigin()}/appointments?contact=${policy.contactId}`,
        }

        const emailContent = getPortalRedirectEmailTemplate(
          `${policy.contact.firstName} ${policy.contact.lastName}`,
          portalLinks
        )

        await sendTestEmail(
          policy.contact.email,
          'Your Plan Has Been Updated - Portal Access',
          emailContent,
          policy.contactId
        )
      } catch (error) {
        console.error('Failed to send portal email on plan change:', error)
        // Don't fail the policy update if email fails
      }
    }

    return NextResponse.json(policy)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

