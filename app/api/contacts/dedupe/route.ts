import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, mobilePhone: true }
    })
    const emailMap = new Map<string, string[]>()
    const phoneMap = new Map<string, string[]>()

    for (const c of contacts) {
      const e = (c.email || '').trim().toLowerCase()
      if (e) emailMap.set(e, [...(emailMap.get(e) || []), c.id])
      const p = (c.mobilePhone || '').replace(/\D+/g,'')
      if (p) phoneMap.set(p, [...(phoneMap.get(p) || []), c.id])
    }

    const pairs = (map: Map<string, string[]>) => {
      const res: Array<{ ids: string[], reason: string }> = []
      map.forEach((ids, key) => {
        if (ids.length > 1) res.push({ ids, reason: key })
      })
      return res
    }

    return NextResponse.json({
      byEmail: pairs(emailMap),
      byPhone: pairs(phoneMap),
      totalContacts: contacts.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
