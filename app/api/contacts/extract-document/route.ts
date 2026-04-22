import { NextRequest, NextResponse } from 'next/server'
import {
  extractParsedFromUpload,
  parsedDataToFormFields,
} from '@/lib/contact-document-extract'
import { getAuthUserFromRequest } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { requestMeta } from '@/lib/request-meta'
import { canUploadDocuments, normalizeRole } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 12 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canUploadDocuments(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file?.size) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large (max 12 MB).' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsedData = await extractParsedFromUpload(buffer, file.name)
    const formSuggestion = parsedDataToFormFields(parsedData)

    await logAudit(
      'DOCUMENT_EXTRACT',
      auth.userId,
      undefined,
      file.name,
      undefined,
      undefined,
      requestMeta(request),
      { fileSize: file.size, mime: file.type || null }
    )

    return NextResponse.json({
      parsedData,
      formSuggestion,
    })
  } catch (error: any) {
    console.error('extract-document:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse document' },
      { status: 400 }
    )
  }
}
