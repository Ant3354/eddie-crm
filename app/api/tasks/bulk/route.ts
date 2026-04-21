import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskIds, action } = body || {}
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds required' }, { status: 400 })
    }

    if (action === 'delete') {
      const result = await prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      })
      return NextResponse.json({ success: true, deleted: result.count })
    }

    if (action === 'complete') {
      const result = await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, updated: result.count })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
