import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { logAudit } from '@/lib/audit'
import { getAuthUserFromRequest } from '@/lib/auth'
import { canViewSensitive, normalizeRole } from '@/lib/rbac'
import { requestMeta } from '@/lib/request-meta'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canViewSensitive(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const row = await prisma.sensitiveData.findUnique({
      where: { contactId: params.id },
    })
    if (!row) {
      return NextResponse.json({ dob: null, ssn: null })
    }

    const meta = requestMeta(request)
    await logAudit(
      'SENSITIVE_VIEWED',
      auth.userId,
      params.id,
      'DOB_SSN',
      undefined,
      undefined,
      meta,
      { contactId: params.id }
    )

    let dob: string | null = null
    let ssn: string | null = null
    try {
      if (row.dob) dob = decrypt(row.dob)
    } catch {
      dob = null
    }
    try {
      if (row.ssn) ssn = decrypt(row.ssn)
    } catch {
      ssn = null
    }

    return NextResponse.json(
      { dob, ssn },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
