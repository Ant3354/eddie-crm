import { NextRequest, NextResponse } from 'next/server'
import { mergeContactsIntoTarget } from '@/lib/contact-merge'
import { getAuthUserFromRequest } from '@/lib/auth'
import { canMergeContacts, normalizeRole } from '@/lib/rbac'
import { logAudit } from '@/lib/audit'
import { requestMeta } from '@/lib/request-meta'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canMergeContacts(normalizeRole(auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { targetId, sourceIds } = await request.json()
    if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json({ error: 'targetId and sourceIds required' }, { status: 400 })
    }
    if (sourceIds.length > 50) {
      return NextResponse.json({ error: 'Too many source contacts (max 50)' }, { status: 400 })
    }

    await mergeContactsIntoTarget(targetId, sourceIds)

    await logAudit(
      'CONTACTS_MERGED',
      auth.userId,
      targetId,
      undefined,
      undefined,
      undefined,
      requestMeta(request),
      { targetId, sourceCount: sourceIds.length, sourceIds }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
