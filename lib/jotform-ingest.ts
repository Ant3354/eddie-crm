import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { mapJotformInterestToCategory } from '@/lib/jotform-map-category'
import {
  coerceJotformAnswerToString,
  extractIdentityHintsFromJotformAnswers,
  normalizeContactIdentityStrings,
} from '@/lib/jotform-field-coercion'
import {
  buildJotformIntakeSummary,
  buildLeadNotesBlock,
  extractDobFromAnswerMap,
  extractGenderFromAnswerMap,
} from '@/lib/jotform-intake-summary'
import { encrypt } from '@/lib/encryption'
import type { Prisma } from '@prisma/client'
import { mergeIntakeDuplicates } from '@/lib/contact-merge'
import { applyIntakePipelineRules } from '@/lib/intake-pipeline-rules'
import { inferNameFromAnswerMap, inferNameFromFreeText } from '@/lib/intake-name-fallback'

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
  const answerMap: Record<string, string> = {}

  if (body.answers && Array.isArray(body.answers)) {
    body.answers.forEach((ans: any) => {
      const fieldName = (ans.name || ans.text || ans.title || '').toLowerCase().trim()
      const rawAns = ans.answer ?? ans.value ?? ans.text
      const value = coerceJotformAnswerToString(rawAns)

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
      ''
    lastName =
      answerMap['last name'] ||
      answerMap['lastname'] ||
      answerMap['lastName'] ||
      answerMap['name']?.split(' ').slice(1).join(' ') ||
      answerMap['name']?.split(',')[1] ||
      ''

    email =
      answerMap['email'] ||
      answerMap['e-mail'] ||
      answerMap['email address'] ||
      ''

    phone =
      answerMap['phone'] ||
      answerMap['phone number'] ||
      answerMap['mobile'] ||
      answerMap['mobile phone'] ||
      answerMap['cell phone'] ||
      answerMap['telephone'] ||
      ''

    if (phone && typeof phone === 'string') {
      phone = phone.trim()
    }

    address =
      answerMap['address'] ||
      answerMap['street address'] ||
      answerMap['full address'] ||
      answerMap['street'] ||
      answerMap['zip code'] ||
      answerMap['zipcode'] ||
      answerMap['zip code?'] ||
      answerMap['postal code'] ||
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
      ''

    notes =
      answerMap['notes'] ||
      answerMap['additional notes'] ||
      answerMap['additional notes:'] ||
      answerMap['comments'] ||
      answerMap['message'] ||
      ''

    source =
      answerMap['utm_source'] ||
      answerMap['source'] ||
      answerMap['referral source'] ||
      answerMap['name of the dental office referring you'] ||
      answerMap['name of the dental office referring you?'] ||
      'JotForm'

    referralCode = answerMap['referral code'] || answerMap['referral_code'] || ''

    const hints = extractIdentityHintsFromJotformAnswers(body.answers)
    firstName = firstName || hints.firstName
    lastName = lastName || hints.lastName
    phone = phone || hints.phone
    address = address || hints.address

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

  const intakeSummary =
    Object.keys(answerMap).length > 0 ? buildJotformIntakeSummary(answerMap) : ''
  const dobRaw = extractDobFromAnswerMap(answerMap)
  const genderVal = extractGenderFromAnswerMap(answerMap)
  const preferredContactTime = (appointmentTime || '').trim()
  const leadNotesBlock = buildLeadNotesBlock(appointmentTime, notes, interestType)

  {
    const id = normalizeContactIdentityStrings(
      firstName || '',
      lastName || '',
      (phone || '').trim(),
      address || ''
    )
    firstName = id.firstName
    lastName = id.lastName
    phone = id.phone
    address = id.address
  }

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
      const valueStr = coerceJotformAnswerToString(ans.answer ?? ans.value ?? ans.text).trim()

      if (fieldName.includes('qr_code_id') || fieldName.includes('qr code id')) {
        qrCodeId = valueStr || qrCodeId
      }
      if (fieldName.includes('referral_code') || fieldName.includes('referral code')) {
        referralCode = valueStr || referralCode
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

  let qrSourceLabel: string | null = null
  if (qrCodeId) {
    try {
      const qrRow = await prisma.qrCode.findUnique({
        where: { id: qrCodeId },
        select: { source: true },
      })
      if (qrRow?.source?.trim()) qrSourceLabel = qrRow.source.trim()
    } catch {
      /* ignore */
    }
  }

  let status = 'LEAD'
  if (appointmentTime) {
    status = 'SCHEDULED'
  }

  const category = mapJotformInterestToCategory(interestType)

  if (!(firstName || '').trim() && !(lastName || '').trim()) {
    const fromMap = inferNameFromAnswerMap(answerMap)
    if (fromMap.firstName || fromMap.lastName) {
      firstName = fromMap.firstName
      lastName = fromMap.lastName
    }
  }
  if (!(firstName || '').trim() && !(lastName || '').trim()) {
    const fromNotes = inferNameFromFreeText(
      notes,
      ...Object.values(answerMap).filter((v) => typeof v === 'string')
    )
    if (fromNotes.firstName || fromNotes.lastName) {
      firstName = fromNotes.firstName
      lastName = fromNotes.lastName
    }
  }

  if (!firstName && !lastName) {
    const fullName =
      body.formData?.name || body.name || body['Name'] || body['Full Name'] || ''
    if (fullName) {
      const nameParts = fullName.trim().split(' ')
      firstName = nameParts[0] || 'Unknown'
      lastName = nameParts.slice(1).join(' ') || ''
    } else {
      firstName = 'Unknown'
      lastName = 'Contact'
    }
  }
  if (firstName && !lastName) {
    lastName = ''
  }

  let intakeSummaryFinal = intakeSummary
  if (qrSourceLabel) {
    const head = `QR location: ${qrSourceLabel}`
    intakeSummaryFinal = intakeSummaryFinal ? `${head}\n\n${intakeSummaryFinal}` : head
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

  const identityOr: Prisma.ContactWhereInput[] = []
  if (email?.trim()) {
    identityOr.push({ email: { equals: email.trim(), mode: 'insensitive' } })
  }
  if (phone?.trim()) {
    identityOr.push({ mobilePhone: phone.trim() })
  }
  let isNewContact = false
  let contact =
    identityOr.length > 0
      ? await prisma.contact.findFirst({
          where: { OR: identityOr },
        })
      : null

  if (contact) {
    const cleaned = normalizeContactIdentityStrings(
      firstName || contact.firstName || '',
      lastName || contact.lastName || '',
      (phone || contact.mobilePhone || '').trim(),
      address || contact.address || ''
    )
    firstName = cleaned.firstName
    lastName = cleaned.lastName
    phone = cleaned.phone
    address = cleaned.address

    const nextSubmissionAt =
      submissionAt &&
      (!contact.lastJotformSubmissionAt || submissionAt > contact.lastJotformSubmissionAt)
        ? submissionAt
        : contact.lastJotformSubmissionAt
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firstName,
        lastName,
        email: email || contact.email,
        mobilePhone: (phone && phone.trim()) || contact.mobilePhone,
        address: (address && address.trim()) || contact.address,
        languagePreference: language || contact.languagePreference,
        category: category as any,
        status: status as any,
        ...(nextSubmissionAt ? { lastJotformSubmissionAt: nextSubmissionAt } : {}),
        ...(genderVal ? { gender: genderVal } : {}),
        ...(preferredContactTime
          ? { preferredContactTime }
          : {}),
        ...(leadNotesBlock ? { leadNotes: leadNotesBlock } : {}),
        ...(intakeSummaryFinal ? { jotformIntakeSummary: intakeSummaryFinal } : {}),
        ...(qrSourceLabel ? { qrSourceLabel } : {}),
      },
    })
    if (verbose) console.log('Updated existing contact:', contact.id)
  } else {
    isNewContact = true
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
        ...(genderVal ? { gender: genderVal } : {}),
        ...(preferredContactTime ? { preferredContactTime } : {}),
        ...(leadNotesBlock ? { leadNotes: leadNotesBlock } : {}),
        ...(intakeSummaryFinal ? { jotformIntakeSummary: intakeSummaryFinal } : {}),
        ...(qrSourceLabel ? { qrSourceLabel } : {}),
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

  try {
    const merged = await mergeIntakeDuplicates(contact.id, { email, mobilePhone: phone })
    if (verbose && merged > 0) console.log('🔗 Merged duplicate contacts:', merged)
  } catch (err) {
    console.warn('JotForm ingest: duplicate merge skipped:', err)
  }

  try {
    await applyIntakePipelineRules({
      contactId: contact.id,
      isNewContact,
      source,
      qrCodeId: qrCodeId || null,
    })
  } catch (err) {
    console.warn('JotForm ingest: pipeline rules error:', err)
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

  if (dobRaw) {
    try {
      await prisma.sensitiveData.upsert({
        where: { contactId: contact.id },
        create: {
          contactId: contact.id,
          dob: encrypt(dobRaw),
        },
        update: { dob: encrypt(dobRaw) },
      })
    } catch (e) {
      console.warn('JotForm ingest: could not store DOB in SensitiveData:', e)
    }
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

  await logAudit(
    'JOTFORM_SUBMISSION',
    undefined,
    contact.id,
    'submissionTime',
    undefined,
    submissionAt && !isNaN(submissionAt.getTime()) ? submissionAt.toISOString() : ''
  )

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
