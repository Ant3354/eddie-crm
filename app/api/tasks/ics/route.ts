import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatDate(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = dt.getUTCFullYear()
  const m = pad(dt.getUTCMonth() + 1)
  const d = pad(dt.getUTCDate())
  const hh = pad(dt.getUTCHours())
  const mm = pad(dt.getUTCMinutes())
  const ss = pad(dt.getUTCSeconds())
  return `${y}${m}${d}T${hh}${mm}${ss}Z`
}

export async function GET(request: NextRequest) {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: { in: ['PENDING','IN_PROGRESS'] } },
      include: { contact: true },
      orderBy: { dueDate: 'asc' },
    })

    const lines: string[] = []
    lines.push('BEGIN:VCALENDAR')
    lines.push('VERSION:2.0')
    lines.push('PRODID:-//EDDIE CRM//Tasks//EN')

    for (const t of tasks) {
      if (!t.dueDate) continue
      const start = new Date(t.dueDate)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${t.id}@eddiecrm`)
      lines.push(`DTSTAMP:${formatDate(new Date())}`)
      lines.push(`DTSTART:${formatDate(start)}`)
      lines.push(`DTEND:${formatDate(end)}`)
      lines.push(`SUMMARY:${t.title}`)
      const desc = `${t.description || ''}${t.contact ? `\nContact: ${t.contact.firstName} ${t.contact.lastName}` : ''}`
      lines.push(`DESCRIPTION:${desc.replace(/\n/g,'\\n')}`)
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')

    return new NextResponse(lines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="eddiecrm-tasks.ics"',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
