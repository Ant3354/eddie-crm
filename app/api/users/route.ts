import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { email: 'asc' },
      select: { id: true, email: true, name: true, role: true },
    })
    return NextResponse.json(users, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
