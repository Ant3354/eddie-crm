import { NextRequest, NextResponse } from 'next/server'
import { mergeContactsIntoTarget } from '@/lib/contact-merge'

export async function POST(request: NextRequest) {
  try {
    const { targetId, sourceIds } = await request.json()
    if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json({ error: 'targetId and sourceIds required' }, { status: 400 })
    }

    await mergeContactsIntoTarget(targetId, sourceIds)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
