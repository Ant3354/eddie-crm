import { jsPDF } from 'jspdf'
import { INTAKE_ROUTING_EMAIL, INTAKE_ROUTING_NAME } from '@/lib/intake-routing'

export type IntakePdfFields = {
  firstName: string
  lastName: string
  email: string
  mobilePhone: string
  address: string
  languagePreference: string
  interestType: string
  appointmentTime: string
  dentalOfficeReferring: string
  notes: string
  gender?: string
  dateOfBirth?: string
  qrCodeId?: string
  contactId?: string
}

function writeWrapped(doc: jsPDF, startY: number, text: string, maxWidth: number, lineHeight: number): number {
  const parts = doc.splitTextToSize(text, maxWidth)
  let y = startY
  for (const line of parts) {
    doc.text(line, 20, y)
    y += lineHeight
  }
  return y
}

export function downloadIntakePdf(fields: IntakePdfFields): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const maxW = pageW - 40

  let y = 48
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Dental intake — summary', 20, y)
  y += 36

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)

  const rows: [string, string][] = [
    ['First name', fields.firstName],
    ['Last name', fields.lastName],
    ['Email', fields.email || '—'],
    ['Mobile phone', fields.mobilePhone || '—'],
    ['Address / ZIP', fields.address || '—'],
    ['Gender', fields.gender || '—'],
    ['Date of birth', fields.dateOfBirth || '—'],
    ['Language', fields.languagePreference],
    ['I am a', fields.interestType],
    ['Best time to reach', fields.appointmentTime || '—'],
    ['Referring office', fields.dentalOfficeReferring || '—'],
    ['Notes', fields.notes || '—'],
    ['QR code ID', fields.qrCodeId || '—'],
    ['Contact ID (CRM)', fields.contactId || '—'],
  ]

  for (const [k, v] of rows) {
    y = writeWrapped(doc, y, `${k}: ${v}`, maxW, 16)
    y += 6
    if (y > 720) {
      doc.addPage()
      y = 48
    }
  }

  y += 24
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  y = writeWrapped(
    doc,
    y,
    `Next step — email this PDF to ${INTAKE_ROUTING_NAME} at ${INTAKE_ROUTING_EMAIL}. This app does not send email automatically; open your email app, attach this downloaded file, and send.`,
    maxW,
    15
  )

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  writeWrapped(doc, y + 8, `Generated ${new Date().toLocaleString()}`, maxW, 12)

  const safe = `${fields.lastName || 'intake'}-${fields.firstName || 'form'}`.replace(/[^\w\-]+/g, '-').slice(0, 60)
  doc.save(`intake-summary-${safe}-${Date.now()}.pdf`)
}

export function buildIntakeMailtoBody(fields: IntakePdfFields): string {
  return [
    `Please find the intake summary attached as PDF (download from the intake thank-you page if you have not already).`,
    ``,
    `Name: ${fields.firstName} ${fields.lastName}`,
    `Email: ${fields.email || '—'}`,
    `Mobile phone: ${fields.mobilePhone || '—'}`,
    `Gender: ${fields.gender || '—'}`,
    `DOB: ${fields.dateOfBirth || '—'}`,
    `Interest: ${fields.interestType}`,
    `QR ID: ${fields.qrCodeId || '—'}`,
    `CRM contact ID: ${fields.contactId || '—'}`,
    ``,
    `— Sent manually from local CRM intake`,
  ].join('\n')
}
