import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { mapJotformInterestToCategory } from '@/lib/jotform-map-category'

export type IngestJotformOptions = {
  /** Webhook URL (for QR UTM query params). Omit for API-poll imports. */
  requestUrl?: string
  /** Stored on JotformSyncedSubmission when submission + form ids are known. */
  syncSource?: 'api_poll' | 'webhook'
  /** When false, skip large console.log of full body (cron runs). */
  verboseLog?: boolean
}

function normalizeAnswersToArray(body: any): any {
  if (!body || typeof body !== 'object') return body
  const answers = body.answers
  if (!answers || Array.isArray(answers)) return body
  if (typeof answers !== 'object') return body
  const arr = Object.entries(answers as Record<string, unknown>).map(([fieldId, val]) => {
    const v = val as Record<string, unknown>
    return {
      id: fieldId,
      name: v?.name ?? v?.text ?? '',
      text: v?.text,
      answer: v?.answer ?? v?.prettyFormat ?? v?.text,
      value: v?.value,
      answerID: v?.answerID,
    }
  })
  return { ...body, answers: arr }
}

/** JotForm sometimes sends the landing URL in rawRequest / request — pick up qr_code_id if present. */
function extractQrCodeIdFromJotformPayload(body: any): string | null {
  const candidates = [body.rawRequest, body.raw_request, body.request, body.requestURL]
  for (const c of candidates) {
    if (typeof c !== 'string' || !c.trim()) continue
    const m = c.match(/qr_code_id=([^&\s#"']+)/)
    if (m?.[1]) {
      try {
        return decodeURIComponent(m[1])
      } catch {
        return m[1]
      }
    }
  }
  return null
}

/** Parse JotForm submission timestamp from webhook or REST row. */
export function parseJotformSubmissionDate(body: any): Date | null {
  const candidates = [
    body?.created_at,
    body?.updated_at,
    body?.createdAt,
    body?.submissionTime,
    body?.timestamp,
    body?.time,
  ]
  for (const c of candidates) {
    if (c == null || c === '') continue
    if (typeof c === 'number') {
      const ms = c > 1e12 ? c : c > 1e9 ? c * 1000 : NaN
      if (!isNaN(ms)) return new Date(ms)
      continue
    }
    const d = new Date(String(c))
    if (!isNaN(d.getTime())) return d
  }
  return null
}

export type IngestJotformResult = {
  success: true
  contactId: string
  qrCodeId: string | null
  referralCode: string | null
  message: string
}

/**
 * Shared path for JotForm webhook POST and REST API–synced submissions.
 * Expects the same field mapping as the legacy webhook handler.
 */
export async function ingestJotformPayload(
  body: any,
  options?: IngestJotformOptions
): Promise<IngestJotformResult> {
  const verbose = options?.verboseLog !== false
  body = normalizeAnswersToArray(body)
  const qrFromRawPayload = extractQrCodeIdFromJotformPayload(body)
  const submissionAt = parseJotformSubmissionDate(body)

  if (verbose) {
    console.log('📥 JotForm ingest:', JSON.stringify(body, null, 2))
    if (options?.requestUrl) console.log('🔍 Request URL:', options.requestUrl)
  }

  let firstName = ''
  let lastName = ''
  let email: string | undefined = ''
  let phone: string | undefined = ''
  let address = ''
  let language = 'English'
  let interestType = 'PROSPECT'
  let appointmentTime = ''
  let notes = ''
  let source = 'JotForm'
  let referralCode = ''

  if (body.answers && Array.isArray(body.answers)) {
    const answerMap: { [key: string]: any } = {}
    body.answers.forEach((ans: any) => {
      const fieldName = (ans.name || ans.text || ans.title || '').toLowerCase().trim()
      let value = ''

      if (typeof ans.answer === 'object' && ans.answer !== null) {
        value =
          ans.answer.name ||
          ans.answer.text ||
          ans.answer.value ||
          JSON.stringify(ans.answer) ||
          ''
      } else {
        value = String(ans.answer || ans.value || ans.text || '').trim()
      }

      if (fieldName.includes('phone') || fieldName.includes('address')) {
        if (verbose) {
          console.log(`📞 Field: ${fieldName}, Raw value: ${JSON.stringify(ans.answer)}, Extracted: ${value}`)
        }
      }

      if (fieldName) {
        answerMap[fieldName] = value
      }
      if (ans.id) {
        answerMap[`id_${ans.id}`] = value
      }
      if (ans.answerID) {
        answerMap[`answer_${ans.answerID}`] = value
      }
    })

    if (verbose) {
      console.log('📋 Parsed answer map:', JSON.stringify(answerMap, null, 2))
    }

    firstName =
      answerMap['first name'] ||
      answerMap['firstname'] ||
      answerMap['firstName'] ||
      answerMap['name']?.split(' ')[0] ||
      answerMap['name']?.split(',')[0] ||
      answerMap['id_3'] ||
      ''
    lastName =
      answerMap['last name'] ||
      answerMap['lastname'] ||
      answerMap['lastName'] ||
      answerMap['name']?.split(' ').slice(1).join(' ') ||
      answerMap['name']?.split(',')[1] ||
      answerMap['id_4'] ||
      ''

    email =
      answerMap['email'] ||
      answerMap['e-mail'] ||
      answerMap['email address'] ||
      answerMap['id_9'] ||
      ''

    phone =
      answerMap['phone'] ||
      answerMap['phone number'] ||
      answerMap['mobile'] ||
      answerMap['mobile phone'] ||
      answerMap['cell phone'] ||
      answerMap['telephone'] ||
      answerMap['id_8'] ||
      ''

    if (phone && typeof phone === 'string') {
      phone = phone.trim()
    }

    address =
      answerMap['address'] ||
      answerMap['street address'] ||
      answerMap['full address'] ||
      answerMap['street'] ||
      answerMap['city'] ||
      answerMap['state'] ||
      answerMap['zip code'] ||
      answerMap['zipcode'] ||
      answerMap['zip code?'] ||
      answerMap['postal code'] ||
      answerMap['id_7'] ||
      ''

    if (!address || address.length < 10) {
      const addressParts = []
      if (answerMap['street address'] || answerMap['street']) {
        addressParts.push(answerMap['street address'] || answerMap['street'])
      }
      if (answerMap['city']) {
        addressParts.push(answerMap['city'])
      }
      if (answerMap['state']) {
        addressParts.push(answerMap['state'])
      }
      if (answerMap['zip code'] || answerMap['zipcode'] || answerMap['zip code?']) {
        addressParts.push(answerMap['zip code'] || answerMap['zipcode'] || answerMap['zip code?'])
      }
      if (addressParts.length > 0) {
        address = addressParts.join(', ')
      }
    }

    if (address && typeof address === 'string') {
      address = address.trim()
    }

    language = answerMap['language'] || answerMap['language preference'] || 'English'

    interestType =
      answerMap['interest type'] ||
      answerMap['category'] ||
      answerMap['type'] ||
      answerMap['level of dental work needed'] ||
      answerMap['level of dental work needed ?'] ||
      answerMap['dental work'] ||
      answerMap['id_11'] ||
      'PROSPECT'

    for (const [key, val] of Object.entries(answerMap)) {
      const vv = typeof val === 'string' ? val.trim() : String(val || '').trim()
      if (!vv) continue
      const kk = key.toLowerCase()
      if (
        kk.includes('interest') ||
        kk.includes('inquiry') ||
        kk.includes('organization') ||
        kk.includes('office type') ||
        kk.includes('business type') ||
        kk.includes('partner type') ||
        kk.includes('your role') ||
        (kk.includes('type') && (kk.includes('office') || kk.includes('location')))
      ) {
        if (!interestType || interestType === 'PROSPECT') interestType = vv
      }
    }

    appointmentTime =
      answerMap['appointment time'] ||
      answerMap['appointment'] ||
      answerMap['preferred appointment time'] ||
      answerMap['best time of day to reach you'] ||
      answerMap['best time of day to reach you?'] ||
      answerMap['id_10'] ||
      ''

    notes =
      answerMap['notes'] ||
      answerMap['additional notes'] ||
      answerMap['additional notes:'] ||
      answerMap['comments'] ||
      answerMap['message'] ||
      answerMap['id_13'] ||
      ''

    source =
      answerMap['utm_source'] ||
      answerMap['source'] ||
      answerMap['referral source'] ||
      answerMap['name of the dental office referring you'] ||
      answerMap['name of the dental office referring you?'] ||
      answerMap['id_14'] ||
      'JotForm'

    referralCode = answerMap['referral code'] || answerMap['referral_code'] || ''

    if (verbose) {
      console.log('✅ Extracted data:', {
        firstName,
        lastName,
        email,
        phone,
        source,
        referralCode,
      })
    }
  }

  firstName =
    firstName ||
    body.formData?.firstName ||
    body.firstName ||
    body['First Name'] ||
    body['first name'] ||
    ''
  lastName =
    lastName ||
    body.formData?.lastName ||
    body.lastName ||
    body['Last Name'] ||
    body['last name'] ||
    ''
  email =
    email ||
    body.formData?.email ||
    body.email ||
    body['Email'] ||
    body['e-mail'] ||
    ''
  phone =
    phone ||
    body.formData?.phone ||
    body.mobilePhone ||
    body.phone ||
    body['Phone'] ||
    body['Mobile Phone'] ||
    ''
  address =
    address || body.formData?.address || body.address || body['Address'] || ''
  language =
    language ||
    body.formData?.language ||
    body.languagePreference ||
    body.language ||
    'English'
  interestType =
    interestType ||
    body.formData?.interestType ||
    body.category ||
    body.interestType ||
    'PROSPECT'
  appointmentTime =
    appointmentTime ||
    body.formData?.appointmentTime ||
    body.preferredAppointmentTime ||
    body.appointmentTime ||
    ''
  notes = notes || body.formData?.notes || body.notes || body['Notes'] || ''
  source =
    source ||
    body.formData?.utm_source ||
    body.utm_source ||
    body.source ||
    'JotForm'
  referralCode =
    referralCode ||
    body.formData?.referral_code ||
    body.referral_code ||
    body.referralCode ||
    ''

  let qrCodeId: string | null = null
  if (options?.requestUrl) {
    try {
      const url = new URL(options.requestUrl)
      source = url.searchParams.get('utm_source') || source
      referralCode = url.searchParams.get('referral_code') || referralCode
      qrCodeId = url.searchParams.get('qr_code_id')
    } catch {
      // ignore
    }
  }

  if (body.answers && Array.isArray(body.answers)) {
    body.answers.forEach((ans: any) => {
      const fieldName = (ans.name?.toLowerCase() || ans.text?.toLowerCase() || '').trim()
      const value = ans.answer || ans.value || ''

      if (fieldName.includes('qr_code_id') || fieldName.includes('qr code id')) {
        qrCodeId = value || qrCodeId
      }
      if (fieldName.includes('referral_code') || fieldName.includes('referral code')) {
        referralCode = value || referralCode
      }
    })
  }

  if (body.formData) {
    qrCodeId = body.formData.qr_code_id || body.formData.qrCodeId || qrCodeId
    referralCode = body.formData.referral_code || body.formData.referralCode || referralCode
  }

  if (!qrCodeId && qrFromRawPayload) {
    qrCodeId = qrFromRawPayload
  }

  let status = 'LEAD'
  if (appointmentTime) {
    status = 'SCHEDULED'
  }

  const category = mapJotformInterestToCategory(interestType)

  if (!firstName && !lastName) {
    const fullName =
      body.formData?.name || body.name || body['Name'] || body['Full Name'] || ''
    if (fullName) {
      const nameParts = fullName.trim().split(' ')
      firstName = nameParts[0] || 'Unknown'
      lastName = nameParts.slice(1).join(' ') || 'Contact'
    } else {
      firstName = 'Unknown'
      lastName = 'Contact'
    }
  }

  if (!email && !phone) {
    console.warn('⚠️ JotForm ingest: No email or phone provided, using placeholder')
    email = `noreply-${Date.now()}@jotform.local`
  }

  if (email && email.trim() === '') {
    email = undefined
  }
  if (phone && phone.trim() === '') {
    phone = undefined
  }

  let contact = await prisma.contact.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ mobilePhone: phone }] : [])],
    },
  })

  if (contact) {
    const nextSubmissionAt =
      submissionAt &&
      (!contact.lastJotformSubmissionAt || submissionAt > contact.lastJotformSubmissionAt)
        ? submissionAt
        : contact.lastJotformSubmissionAt
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firstName: firstName || contact.firstName,
        lastName: lastName || contact.lastName,
        email: email || contact.email,
        mobilePhone: phone || contact.mobilePhone,
        address: address || contact.address,
        languagePreference: language || contact.languagePreference,
        category: category as any,
        status: status as any,
        ...(nextSubmissionAt ? { lastJotformSubmissionAt: nextSubmissionAt } : {}),
      },
    })
    if (verbose) console.log('Updated existing contact:', contact.id)
  } else {
    contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: (email && email.trim()) || undefined,
        mobilePhone: (phone && phone.trim()) || undefined,
        address: (address && address.trim()) || undefined,
        languagePreference: language,
        category: category as any,
        status: status as any,
        ...(submissionAt ? { lastJotformSubmissionAt: submissionAt } : {}),
      },
    })
    if (verbose) console.log('Created new contact:', contact.id)

    if (referralCode) {
      try {
        const { trackReferralConversion } = await import('@/lib/referral-links')
        await trackReferralConversion(referralCode, contact.id)
      } catch (err) {
        console.error('Failed to track referral conversion:', err)
      }
    }
  }

  if (source) {
    await prisma.contactTag.upsert({
      where: {
        contactId_name: {
          contactId: contact.id,
          name: `Referral Source: ${source}`,
        },
      },
      create: {
        contactId: contact.id,
        name: `Referral Source: ${source}`,
      },
      update: {},
    })
  }

  if (language && language !== 'English') {
    await prisma.contactTag.upsert({
      where: {
        contactId_name: {
          contactId: contact.id,
          name: `Language: ${language}`,
        },
      },
      create: {
        contactId: contact.id,
        name: `Language: ${language}`,
      },
      update: {},
    })
  }

  if (status === 'ENROLLED' || status === 'ACTIVE_CLIENT') {
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        enrolledDate: new Date(),
      },
    })

    if (category === 'CONSUMER') {
      try {
        const referralCampaign = await prisma.campaign.findFirst({
          where: {
            type: 'REFERRAL_DRIP',
            category: 'CONSUMER',
            isActive: true,
          },
        })

        if (referralCampaign) {
          await prisma.campaignContact.create({
            data: {
              campaignId: referralCampaign.id,
              contactId: contact.id,
              status: 'ACTIVE',
              currentStep: 0,
            },
          })
        }
      } catch (err) {
        console.error('Failed to start referral campaign:', err)
      }
    }

    if (contact.email && contact.emailOptIn) {
      try {
        const { sendEmail, getPortalRedirectEmailTemplate } = await import('@/lib/email')
        const policy = await prisma.policy.findFirst({
          where: { contactId: contact.id },
          orderBy: { createdAt: 'desc' },
        })

        const portalLinks = {
          memberPortal: policy?.memberPortalLink || undefined,
          pharmacy: policy?.pharmacyLink || undefined,
          riderBenefits: policy?.riderBenefitsLink || undefined,
          supportPhone: process.env.SUPPORT_PHONE,
          supportChat: process.env.SUPPORT_CHAT_URL,
          appointmentLink: `${process.env.NEXT_PUBLIC_APP_URL}/appointments?contact=${contact.id}`,
        }

        const emailContent = getPortalRedirectEmailTemplate(
          `${contact.firstName} ${contact.lastName}`,
          portalLinks
        )

        await sendEmail(contact.email, 'Your Member Portal Access', emailContent, contact.id)
      } catch (err) {
        console.error('Failed to send portal email:', err)
      }
    }
  }

  if (status === 'SCHEDULED' && appointmentTime) {
    await prisma.task.create({
      data: {
        contactId: contact.id,
        title: 'Confirm Appointment',
        description: `Appointment scheduled for ${appointmentTime}. Please confirm.`,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
  }

  if (qrCodeId) {
    try {
      const { trackQRSubmission } = await import('@/lib/qrcode')
      await trackQRSubmission(qrCodeId)
      if (verbose) console.log('✅ QR submission tracked:', qrCodeId)
    } catch (err) {
      console.error('Failed to track QR submission:', err)
    }
  }

  await logAudit('JOTFORM_SUBMISSION', undefined, contact.id)

  const submissionId = String(
    body.submissionID || body.submission_id || body.submissionId || body.id || ''
  ).trim()
  const formId = String(
    body.formID || body.form_id || process.env.JOTFORM_FORM_ID || ''
  ).trim()

  if (submissionId && formId) {
    const src = options?.syncSource ?? 'webhook'
    await prisma.jotformSyncedSubmission.upsert({
      where: { submissionId },
      create: {
        formId,
        submissionId,
        contactId: contact.id,
        source: src,
        submittedAt: submissionAt ?? undefined,
      },
      update: {
        contactId: contact.id,
        source: src,
        submittedAt: submissionAt ?? undefined,
      },
    })
  }

  if (verbose) {
    console.log('✅ JotForm ingest success:', {
      contactId: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.mobilePhone,
      source,
      referralCode: referralCode || 'none',
      qrCodeId: qrCodeId || 'none',
    })
  }

  return {
    success: true,
    contactId: contact.id,
    qrCodeId: qrCodeId || null,
    referralCode: referralCode || null,
    message: 'Contact processed successfully',
  }
}
