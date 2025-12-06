import QRCode from 'qrcode'
import { prisma } from './prisma'
import fs from 'fs/promises'
import path from 'path'

export async function generateQRCode(
  jotFormUrl: string,
  source: string
): Promise<{ qrCodeUrl: string; qrCodeId: string }> {
  // Create QR code record first to get the ID
  const qrCode = await prisma.qrCode.create({
    data: {
      source,
      jotFormUrl,
      qrCodeUrl: '', // Will update after generating
    },
  })

  // Add UTM parameters and QR code ID for tracking
  const url = new URL(jotFormUrl)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', 'qr')
  url.searchParams.set('utm_campaign', 'referral')
  url.searchParams.set('qr_code_id', qrCode.id) // Add QR code ID for tracking

  const qrDataUrl = await QRCode.toDataURL(url.toString(), {
    width: 300,
    margin: 2,
  })

  // Save QR code to public directory
  const publicDir = path.join(process.cwd(), 'public', 'qrcodes')
  await fs.mkdir(publicDir, { recursive: true })

  const qrCodeFileName = `qr-${qrCode.id}.png`
  const qrCodePath = path.join(publicDir, qrCodeFileName)
  const qrCodeUrl = `/qrcodes/${qrCodeFileName}`

  // Convert data URL to buffer and save
  const base64Data = qrDataUrl.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')
  await fs.writeFile(qrCodePath, buffer)

  // Update QR code with the URL
  await prisma.qrCode.update({
    where: { id: qrCode.id },
    data: {
      jotFormUrl: url.toString(), // Store the full URL with tracking params
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

