import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { trackQRScan } from '@/lib/qrcode'
import { logAudit } from '@/lib/audit'
import { mergeIntakeDuplicates } from '@/lib/contact-merge'
import { applyIntakePipelineRules } from '@/lib/intake-pipeline-rules'
import { inferNameFromFreeText } from '@/lib/intake-name-fallback'
import { encrypt } from '@/lib/encryption'

function normalizeIntakeDob(raw: string | undefined): string | null {
  const t = (raw || '').trim()
  if (t.length < 6 || t.length > 32) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return t
  return null
}

function mapInterestToCategory(interestType: string): string {
  const t = (interestType || '').trim()
  const categoryMap: Record<string, string> = {
    Consumer: 'CONSUMER',
    'Dental Office': 'DENTAL_OFFICE_PARTNER',
    'Health Office': 'HEALTH_OFFICE_PARTNER',
    'Business Partner': 'OTHER_BUSINESS_PARTNER',
    Prospect: 'PROSPECT',
  }
  return categoryMap[t] || 'PROSPECT'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      qrCodeId,
      firstName,
      lastName,
      email,
      mobilePhone,
      address,
      languagePreference,
      interestType,
      appointmentTime,
      notes,
      dentalOfficeReferring,
      gender,
      dateOfBirth,
    } = body

    if (!qrCodeId || typeof qrCodeId !== 'string') {
      return NextResponse.json({ error: 'qrCodeId is required' }, { status: 400 })
    }

    const qr = await prisma.qrCode.findUnique({ where: { id: qrCodeId } })
    if (!qr) {
      return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 404 })
    }

    let fn = String(firstName || '').trim()
    let ln = String(lastName || '').trim()
    const noteStr = notes ? String(notes).trim() : ''
    if (!fn && !ln) {
      const guessed = inferNameFromFreeText(noteStr)
      fn = guessed.firstName.trim()
      ln = guessed.lastName.trim()
    }
    if (!fn && !ln) {
      fn = 'Unknown'
      ln = 'Contact'
    }
    if (fn && !ln) {
      ln = ''
    }

    const em = email ? String(email).trim() : ''
    const phone = mobilePhone ? String(mobilePhone).trim() : ''
    if (!em && !phone) {
      return NextResponse.json(
        { error: 'Please provide at least an email or a phone number' },
        { status: 400 }
      )
    }

    const addr = address ? String(address).trim() : ''
    const language = languagePreference ? String(languagePreference).trim() : 'English'
    const interest = interestType ? String(interestType).trim() : 'Prospect'
    const appt = appointmentTime ? String(appointmentTime).trim() : ''
    const genderVal = gender ? String(gender).trim().slice(0, 80) : ''
    const dobRaw = normalizeIntakeDob(dateOfBirth ? String(dateOfBirth) : undefined)

    const status = appt ? 'SCHEDULED' : 'LEAD'
    const category = mapInterestToCategory(interest)

    const source =
      (dentalOfficeReferring && String(dentalOfficeReferring).trim()) ||
      qr.source ||
      'Local intake'

    const identityOr: Prisma.ContactWhereInput[] = []
    if (em) identityOr.push({ email: { equals: em, mode: 'insensitive' } })
    if (phone) identityOr.push({ mobilePhone: phone })

    let contact = await prisma.contact.findFirst({
      where: { OR: identityOr },
    })
    const isNewContact = !contact

    const stamp = `--- Local QR intake ${new Date().toISOString()} ---`
    const intakeLines = [
      `QR scan location: ${qr.source}`,
      `Referral / source: ${source}`,
      `Email: ${em || '—'}`,
      `Mobile phone: ${phone || '—'}`,
      addr ? `Address: ${addr}` : null,
      `Interest: ${interest}`,
      `Language: ${language}`,
      genderVal ? `Gender: ${genderVal}` : null,
      dobRaw ? `Date of birth: ${dobRaw}` : null,
      appt ? `Best time to reach / appointment: ${appt}` : null,
      noteStr ? `Notes: ${noteStr}` : null,
    ].filter(Boolean) as string[]
    const intakeBlock = `${stamp}\n${intakeLines.join('\n')}`

    if (contact) {
      const prevSummary = contact.jotformIntakeSummary
      const nextSummary = prevSummary ? `${prevSummary}\n\n${intakeBlock}` : intakeBlock
      const leadBits = [noteStr, interest, appt].filter(Boolean).join(' · ')
      const mergedLead = [contact.leadNotes, leadBits].filter(Boolean).join('\n\n').trim().slice(0, 4000)
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          firstName: fn || contact.firstName,
          lastName: ln,
          email: em || contact.email,
          mobilePhone: phone || contact.mobilePhone,
          address: addr || contact.address,
          languagePreference: language || contact.languagePreference,
          category: category as any,
          status: status as any,
          qrSourceLabel: qr.source,
          jotformIntakeSummary: nextSummary,
          ...(genderVal ? { gender: genderVal } : {}),
          ...(mergedLead ? { leadNotes: mergedLead } : {}),
        },
      })
    } else {
      const leadBits = [noteStr, interest, appt].filter(Boolean).join(' · ')
      contact = await prisma.contact.create({
        data: {
          firstName: fn,
          lastName: ln || '',
          email: em || undefined,
          mobilePhone: phone || undefined,
          address: addr || undefined,
          languagePreference: language,
          category: category as any,
          status: status as any,
          qrSourceLabel: qr.source,
          jotformIntakeSummary: intakeBlock,
          ...(genderVal ? { gender: genderVal } : {}),
          ...(leadBits ? { leadNotes: leadBits.slice(0, 4000) } : {}),
        },
      })
    }

    if (dobRaw) {
      try {
        await prisma.sensitiveData.upsert({
          where: { contactId: contact.id },
          create: { contactId: contact.id, dob: encrypt(dobRaw) },
          update: { dob: encrypt(dobRaw) },
        })
      } catch (e) {
        console.warn('Local intake: could not store DOB:', e)
      }
    }

    try {
      const merged = await mergeIntakeDuplicates(contact.id, { email: em || null, mobilePhone: phone || null })
      if (merged > 0) console.log('Local intake: merged duplicate contacts:', merged)
    } catch (e) {
      console.warn('Local intake: duplicate merge skipped:', e)
    }

    try {
      await applyIntakePipelineRules({
        contactId: contact.id,
        isNewContact,
        source,
        qrCodeId,
      })
    } catch (e) {
      console.warn('Local intake: pipeline rules error:', e)
    }

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

    if (noteStr) {
      await prisma.contactTag.upsert({
        where: {
          contactId_name: {
            contactId: contact.id,
            name: `Intake notes: ${noteStr.slice(0, 200)}`,
          },
        },
        create: {
          contactId: contact.id,
          name: `Intake notes: ${noteStr.slice(0, 200)}`,
        },
        update: {},
      })
    }

    if (status === 'SCHEDULED' && appt) {
      await prisma.task.create({
        data: {
          contactId: contact.id,
          title: 'Confirm Appointment',
          description: `Appointment scheduled for ${appt}. Please confirm.`,
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    }

    await trackQRScan(qrCodeId)
    await logAudit('LOCAL_INTAKE_SUBMISSION', undefined, contact.id)

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      message: 'Thank you — your information was received.',
    })
  } catch (error: any) {
    console.error('Local intake error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
