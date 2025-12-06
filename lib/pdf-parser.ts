import pdfParse from 'pdf-parse'
import fs from 'fs/promises'

export interface ParsedPDFData {
  name?: { first?: string; last?: string; full?: string }
  address?: string
  dob?: string
  ssn?: string
  planType?: string
  monthlyPremium?: number
  beneficiaries?: string[]
  policyNumber?: string
  carrier?: string
  confidence: { [key: string]: number }
}

export async function parsePDF(filePath: string): Promise<ParsedPDFData> {
  const dataBuffer = await fs.readFile(filePath)
  const data = await pdfParse(dataBuffer)
  
  const text = data.text
  const result: ParsedPDFData = {
    confidence: {},
  }

  // Extract name patterns
  const namePatterns = [
    /Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /Full Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)/,
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      const fullName = match[1].trim()
      const parts = fullName.split(/\s+/)
      result.name = {
        full: fullName,
        first: parts[0],
        last: parts.slice(1).join(' '),
      }
      result.confidence.name = 0.8
      break
    }
  }

  // Extract address
  const addressPattern = /Address[:\s]+([^\n]+(?:\n[^\n]+){0,2})/i
  const addressMatch = text.match(addressPattern)
  if (addressMatch) {
    result.address = addressMatch[1].trim()
    result.confidence.address = 0.7
  }

  // Extract DOB
  const dobPatterns = [
    /Date of Birth[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /DOB[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  ]
  for (const pattern of dobPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.dob = match[1]
      result.confidence.dob = 0.6
      break
    }
  }

  // Extract SSN (XXX-XX-XXXX)
  const ssnPattern = /SSN[:\s]+(\d{3}-\d{2}-\d{4})/i
  const ssnMatch = text.match(ssnPattern)
  if (ssnMatch) {
    result.ssn = ssnMatch[1]
    result.confidence.ssn = 0.9
  }

  // Extract plan type
  const planPatterns = [
    /Plan Type[:\s]+([^\n]+)/i,
    /Plan[:\s]+([^\n]+)/i,
    /Coverage[:\s]+([^\n]+)/i,
  ]
  for (const pattern of planPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.planType = match[1].trim()
      result.confidence.planType = 0.7
      break
    }
  }

  // Extract premium
  const premiumPatterns = [
    /Premium[:\s]+\$?([\d,]+\.?\d*)/i,
    /Monthly Premium[:\s]+\$?([\d,]+\.?\d*)/i,
    /\$([\d,]+\.?\d*)\s*(?:per|month|monthly)/i,
  ]
  for (const pattern of premiumPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.monthlyPremium = parseFloat(match[1].replace(/,/g, ''))
      result.confidence.monthlyPremium = 0.7
      break
    }
  }

  // Extract policy number
  const policyPattern = /Policy[#\s:]+([A-Z0-9\-]+)/i
  const policyMatch = text.match(policyPattern)
  if (policyMatch) {
    result.policyNumber = policyMatch[1]
    result.confidence.policyNumber = 0.8
  }

  // Extract carrier
  const carrierPatterns = [
    /Carrier[:\s]+([^\n]+)/i,
    /Insurance Company[:\s]+([^\n]+)/i,
    /Provider[:\s]+([^\n]+)/i,
  ]
  for (const pattern of carrierPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.carrier = match[1].trim()
      result.confidence.carrier = 0.7
      break
    }
  }

  // Extract beneficiaries
  const beneficiaryPattern = /Benefici?ary[:\s]+([^\n]+)/gi
  const beneficiaries: string[] = []
  let beneficiaryMatch
  while ((beneficiaryMatch = beneficiaryPattern.exec(text)) !== null) {
    beneficiaries.push(beneficiaryMatch[1].trim())
  }
  if (beneficiaries.length > 0) {
    result.beneficiaries = beneficiaries
    result.confidence.beneficiaries = 0.6
  }

  return result
}

