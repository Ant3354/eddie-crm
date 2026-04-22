import path from 'path'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { parseInsuranceDocumentText, type ParsedPDFData } from '@/lib/pdf-parser'

const ALLOWED_EXT = new Set(['.pdf', '.txt', '.text', '.docx'])

export function extensionFromFileName(name: string): string {
  return path.extname(name).toLowerCase()
}

export function isSupportedContactDocument(name: string): boolean {
  return ALLOWED_EXT.has(extensionFromFileName(name))
}

export async function extractPlainTextFromUpload(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const ext = extensionFromFileName(originalName)
  if (ext === '.doc') {
    throw new Error(
      'Legacy Word .doc is not supported. Save as .docx or PDF and upload again.'
    )
  }
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('Unsupported file type. Use PDF, DOCX, or TXT.')
  }
  if (ext === '.pdf') {
    const data = await pdfParse(buffer)
    return data.text || ''
  }
  if (ext === '.txt' || ext === '.text') {
    return buffer.toString('utf8')
  }
  if (ext === '.docx') {
    const r = await mammoth.extractRawText({ buffer })
    return r.value || ''
  }
  throw new Error('Unsupported file type.')
}

export async function extractParsedFromUpload(
  buffer: Buffer,
  originalName: string
): Promise<ParsedPDFData> {
  const text = await extractPlainTextFromUpload(buffer, originalName)
  return parseInsuranceDocumentText(text)
}

export function parsedDataToFormFields(p: ParsedPDFData): {
  firstName: string
  lastName: string
  email: string
  mobilePhone: string
  address: string
} {
  return {
    firstName: p.name?.first?.trim() || '',
    lastName: p.name?.last?.trim() || '',
    email: p.email?.trim() || '',
    mobilePhone: p.mobilePhone?.trim() || '',
    address: p.address?.trim() || '',
  }
}
