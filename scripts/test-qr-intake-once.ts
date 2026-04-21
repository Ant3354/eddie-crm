/**
 * End-to-end check: POST /api/intake as if a QR scan filled the dental form.
 * Requires: DATABASE_URL, dev server on TEST_INTAKE_BASE_URL (default http://127.0.0.1:3001).
 *
 *   npm run dev   # in another terminal
 *   npx tsx scripts/test-qr-intake-once.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const base = (process.env.TEST_INTAKE_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
  const qr = await prisma.qrCode.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!qr) {
    console.error('No QrCode row in database — create one in CRM → QR Codes first.')
    process.exit(1)
  }

  const stamp = Date.now()
  const body = {
    qrCodeId: qr.id,
    firstName: 'QRIntake',
    lastName: `Test${stamp}`,
    email: `qr-intake-test-${stamp}@example.com`,
    mobilePhone: '+15551234567',
    address: '123 Test St, Testville 90210',
    languagePreference: 'English',
    interestType: 'Consumer',
    appointmentTime: 'Weekday mornings',
    dentalOfficeReferring: 'Test Dental (script)',
    notes: 'Automated test submission from scripts/test-qr-intake-once.ts',
    gender: 'Female',
    dateOfBirth: '1990-06-15',
  }

  const res = await fetch(`${base}/api/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string; contactId?: string }

  if (!res.ok) {
    console.error('Intake HTTP', res.status, data)
    process.exit(1)
  }

  const id = data.contactId
  if (!id) {
    console.error('No contactId in response', data)
    process.exit(1)
  }

  const c = await prisma.contact.findUnique({
    where: { id },
    include: { tags: true },
  })
  if (!c) {
    console.error('Contact not found after create', id)
    process.exit(1)
  }

  const checks: string[] = []
  if (c.mobilePhone?.includes('5551234567')) checks.push('phone OK')
  if (c.email?.includes(`qr-intake-test-${stamp}`)) checks.push('email OK')
  if (c.qrSourceLabel === qr.source) checks.push('qrSourceLabel OK')
  if (c.gender === 'Female') checks.push('gender OK')
  if (c.jotformIntakeSummary?.includes('Mobile phone:')) checks.push('summary has phone line OK')

  const sd = await prisma.sensitiveData.findUnique({ where: { contactId: id } })
  if (sd?.dob) checks.push('dob encrypted row OK')

  console.log('OK contact', id, checks.join(', ') || '(minimal checks)')
  if (checks.length < 4) {
    console.warn('Some optional checks did not match — inspect contact in CRM.', {
      mobilePhone: c.mobilePhone,
      qrSourceLabel: c.qrSourceLabel,
      gender: c.gender,
      summarySnippet: c.jotformIntakeSummary?.slice(0, 200),
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
