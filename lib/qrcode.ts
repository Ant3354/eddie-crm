import QRCode from 'qrcode'
import { prisma } from './prisma'
import fs from 'fs/promises'
import path from 'path'

export type GenerateQRCodeParams = {
  source: string
  /** Public JotForm (or other) URL — stored with UTM + tracking params; QR opens via /api/qrcodes/open first. */
  jotFormUrl: string
}

export function getCrmPublicBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').replace(/\/$/, '')
}

/**
 * On Vercel, the filesystem is ephemeral — store the PNG as a data URL in the DB.
 * Locally, write to `public/qrcodes` for backward compatibility and smaller DB rows.
 */
function shouldStoreQrImageInline(): boolean {
  return Boolean(process.env.VERCEL)
}

export async function generateQRCode(
  params: GenerateQRCodeParams
): Promise<{ qrCodeUrl: string; qrCodeId: string }> {
  const { source, jotFormUrl } = params
  const trimmed = jotFormUrl?.trim()
  if (!trimmed) {
    throw new Error('jotFormUrl is required')
  }

  const qrCode = await prisma.qrCode.create({
    data: {
      source,
      jotFormUrl: trimmed,
      qrCodeUrl: '',
    },
  })

  const destination = new URL(trimmed)
  destination.searchParams.set('utm_source', source)
  destination.searchParams.set('utm_medium', 'qr')
  destination.searchParams.set('utm_campaign', 'referral')
  destination.searchParams.set('qr_code_id', qrCode.id)

  const entry = new URL(`${getCrmPublicBaseUrl()}/api/qrcodes/open`)
  entry.searchParams.set('id', qrCode.id)

  const qrDataUrl = await QRCode.toDataURL(entry.toString(), {
    width: 300,
    margin: 2,
  })

  let qrCodeUrl: string
  if (shouldStoreQrImageInline()) {
    qrCodeUrl = qrDataUrl
  } else {
    const publicDir = path.join(process.cwd(), 'public', 'qrcodes')
    await fs.mkdir(publicDir, { recursive: true })
    const qrCodeFileName = `qr-${qrCode.id}.png`
    const qrCodePath = path.join(publicDir, qrCodeFileName)
    qrCodeUrl = `/qrcodes/${qrCodeFileName}`
    const base64Data = qrDataUrl.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    await fs.writeFile(qrCodePath, buffer)
  }

  await prisma.qrCode.update({
    where: { id: qrCode.id },
    data: {
      jotFormUrl: destination.toString(),
      qrCodeUrl,
    },
  })

  return { qrCodeUrl, qrCodeId: qrCode.id }
}

/** Counts a phone “opening” the QR (hits /api/qrcodes/open before redirect). */
export async function trackQRScan(qrCodeId: string) {
  await prisma.qrCode.update({
    where: { id: qrCodeId },
    data: {
      scanCount: {
        increment: 1,
      },
      lastScanAt: new Date(),
    },
  })
}

/** Counts a JotForm submission tied to this QR (webhook / ingest with qr_code_id). */
export async function trackQRSubmission(qrCodeId: string) {
  try {
    await prisma.qrCode.update({
      where: { id: qrCodeId },
      data: {
        submissionCount: { increment: 1 },
        lastSubmissionAt: new Date(),
      },
    })
  } catch (err) {
    console.error('[trackQRSubmission] skipped:', qrCodeId, err)
  }
}
