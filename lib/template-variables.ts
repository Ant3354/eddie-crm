import { prisma } from './prisma'
import { generateReferralLink } from './referral-links'
import { getPublicAppOrigin } from './app-origin'

export async function replaceTemplateVariables(
  content: string,
  contactId: string,
  additionalVars?: { [key: string]: string }
): Promise<string> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      policies: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  })

  if (!contact) {
    return content
  }

  const policy = contact.policies[0]
  const baseUrl = getPublicAppOrigin()

  // Get referral link
  const referralLink = await generateReferralLink(contactId)

  // Get payment link (if policy exists)
  const paymentLink = policy?.memberPortalLink 
    ? `${policy.memberPortalLink}/payment`
    : `${baseUrl}/payment?contact=${contactId}`

  const variables: { [key: string]: string } = {
    '[CONTACT_NAME]': `${contact.firstName} ${contact.lastName}`,
    '[FIRST_NAME]': contact.firstName,
    '[LAST_NAME]': contact.lastName,
    '[EMAIL]': contact.email || '',
    '[PHONE]': contact.mobilePhone || '',
    '[MOBILE_PHONE]': contact.mobilePhone || '',
    '[REFERRAL_LINK]': referralLink || `${baseUrl}/referral`,
    '[PAYMENT_LINK]': paymentLink,
    '[PORTAL_LINK]': policy?.memberPortalLink || `${baseUrl}/portal?contact=${contactId}`,
    '[PHARMACY_LINK]': policy?.pharmacyLink || '',
    '[RIDER_BENEFITS_LINK]': policy?.riderBenefitsLink || '',
    '[APPOINTMENT_LINK]': `${baseUrl}/appointments?contact=${contactId}`,
    '[SUPPORT_PHONE]': process.env.SUPPORT_PHONE || '',
    '[SUPPORT_EMAIL]': process.env.SUPPORT_EMAIL || '',
    '[SUPPORT_CHAT_URL]': process.env.SUPPORT_CHAT_URL || '',
    '[RENEWAL_DATE]': contact.renewalDate ? new Date(contact.renewalDate).toLocaleDateString() : (policy?.renewalDate ? new Date(policy.renewalDate).toLocaleDateString() : ''),
    '[CARRIER]': policy?.carrier || '',
    '[PLAN_TYPE]': policy?.planType || '',
    '[MONTHLY_PREMIUM]': policy?.monthlyPremium ? `$${policy.monthlyPremium.toFixed(2)}` : '',
    ...additionalVars,
  }

  let result = content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }

  return result
}

export function getBilingualContent(
  englishContent: string,
  spanishContent?: string,
  language?: string
): string {
  if (language === 'Spanish' && spanishContent) {
    return spanishContent
  }
  return englishContent
}

