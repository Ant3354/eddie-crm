import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCrmSettings } from '@/lib/crm-settings'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { settings } = await getCrmSettings()
    const days = settings.uploadRetentionDays ?? 0
    if (!days || days <= 0) {
      return NextResponse.json({ ok: true, skipped: true, message: 'uploadRetentionDays not set' })
    }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const oldFiles = await prisma.file.findMany({
      where: { createdAt: { lt: cutoff }, contactId: { not: null } },
      take: 500,
    })

    let deleted = 0
    for (const f of oldFiles) {
      try {
        if (f.filePath && existsSync(f.filePath)) {
          await unlink(f.filePath)
        }
      } catch {
        // ignore missing files
      }
      await prisma.file.delete({ where: { id: f.id } }).catch(() => {})
      deleted++
    }

    await logAudit('FILE_RETENTION_RUN', undefined, undefined, undefined, undefined, undefined, undefined, {
      days,
      deleted,
    })

    return NextResponse.json({ ok: true, deleted, days })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
