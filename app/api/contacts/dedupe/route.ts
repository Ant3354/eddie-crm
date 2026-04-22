import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type ContactMini = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  mobilePhone: string | null
}

export async function GET(request: NextRequest) {
  try {
    const preview = request.nextUrl.searchParams.get('preview') === '1'

    const contacts = await prisma.contact.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, mobilePhone: true },
    })
    const emailMap = new Map<string, string[]>()
    const phoneMap = new Map<string, string[]>()

    for (const c of contacts) {
      const e = (c.email || '').trim().toLowerCase()
      if (e) emailMap.set(e, [...(emailMap.get(e) || []), c.id])
      const p = (c.mobilePhone || '').replace(/\D+/g, '')
      if (p) phoneMap.set(p, [...(phoneMap.get(p) || []), c.id])
    }

    const byId = new Map(contacts.map((c) => [c.id, c as ContactMini]))

    const pairs = (map: Map<string, string[]>, reasonPrefix: string) => {
      const res: Array<{ ids: string[]; reason: string; contacts?: ContactMini[] }> = []
      map.forEach((ids, key) => {
        if (ids.length > 1) {
          const row: { ids: string[]; reason: string; contacts?: ContactMini[] } = {
            ids,
            reason: `${reasonPrefix}:${key}`,
          }
          if (preview) {
            row.contacts = ids
              .map((id) => byId.get(id))
              .filter((c): c is ContactMini => Boolean(c))
          }
          res.push(row)
        }
      })
      return res
    }

    return NextResponse.json({
      byEmail: pairs(emailMap, 'email'),
      byPhone: pairs(phoneMap, 'phone'),
      totalContacts: contacts.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
