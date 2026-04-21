import QRCode from 'qrcode'
import { prisma } from './prisma'
import fs from 'fs/promises'
import path from 'path'

export type GenerateQRCodeParams = {
  source: string
  /** Public JotForm (or other) URL — encoded in the QR with UTM + tracking params. */
  jotFormUrl: string
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

  const url = new URL(trimmed)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', 'qr')
  url.searchParams.set('utm_campaign', 'referral')
  url.searchParams.set('qr_code_id', qrCode.id)

  const qrDataUrl = await QRCode.toDataURL(url.toString(), {
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
      jotFormUrl: url.toString(),
      qrCodeUrl,
    },
  })

  return { qrCodeUrl, qrCodeId: qrCode.id }
}

export async function trackQRScan(qrCodeId: string) {
  await prisma.qrCode.update({
    where: { id: qrCodeId },
    data: {
      scanCount: {
        increment: 1,
      },
    },
  })
}
