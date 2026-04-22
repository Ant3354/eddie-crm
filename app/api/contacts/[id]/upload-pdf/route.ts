import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractParsedFromUpload } from '@/lib/contact-document-extract'
import { encrypt } from '@/lib/encryption'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getAuthUserFromRequest } from '@/lib/auth'
import { canUploadDocuments, normalizeRole } from '@/lib/rbac'
import { logAudit } from '@/lib/audit'
import { requestMeta } from '@/lib/request-meta'

const MAX_BYTES = 12 * 1024 * 1024

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canUploadDocuments(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 12 MB).' }, { status: 400 })
    }

    // Save file
    const uploadsDir = join(process.cwd(), 'uploads', params.id)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(uploadsDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    const parsedData = await extractParsedFromUpload(buffer, file.name)

    // Save file record
    const fileRecord = await prisma.file.create({
      data: {
        contactId: params.id,
        fileName: file.name,
        filePath: filePath,
        fileType: file.type,
        fileSize: file.size,
        isParsed: true,
        parseResult: parsedData as any,
      },
    })

    // Update contact with parsed data (only if fields are blank)
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    })

    if (contact) {
      const updateData: any = {}
      
      if (!contact.firstName && parsedData.name?.first) {
        updateData.firstName = parsedData.name.first
      }
      if (!contact.lastName && parsedData.name?.last) {
        updateData.lastName = parsedData.name.last
      }
      if (!contact.address && parsedData.address) {
        updateData.address = parsedData.address
      }
      if (!contact.email && parsedData.email) {
        updateData.email = parsedData.email
      }
      if (!contact.mobilePhone && parsedData.mobilePhone) {
        updateData.mobilePhone = parsedData.mobilePhone
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.contact.update({
          where: { id: params.id },
          data: updateData,
        })
      }

      // Create or update policy
      if (parsedData.planType || parsedData.monthlyPremium || parsedData.carrier) {
        await prisma.policy.create({
          data: {
            contactId: params.id,
            carrier: parsedData.carrier,
            planType: parsedData.planType,
            monthlyPremium: parsedData.monthlyPremium,
          },
        })
      }

      // Update sensitive data
      if (parsedData.dob || parsedData.ssn) {
        const sensitiveUpdate: any = {}
        if (parsedData.dob) sensitiveUpdate.dob = encrypt(parsedData.dob)
        if (parsedData.ssn) sensitiveUpdate.ssn = encrypt(parsedData.ssn)

        await prisma.sensitiveData.upsert({
          where: { contactId: params.id },
          create: {
            contactId: params.id,
            ...sensitiveUpdate,
          },
          update: sensitiveUpdate,
        })
      }
    }

    await logAudit(
      'CONTACT_DOCUMENT_UPLOADED',
      auth.userId,
      params.id,
      file.name,
      undefined,
      undefined,
      requestMeta(request),
      {
        fileId: fileRecord.id,
        confidence: parsedData.confidence || {},
      }
    )

    return NextResponse.json({
      success: true,
      file: fileRecord,
      parsedData,
    })
  } catch (error: any) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

