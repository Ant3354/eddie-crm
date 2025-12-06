import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const anyPrisma: any = prisma as any
    if (!anyPrisma.template || typeof anyPrisma.template.findMany !== 'function') {
      return NextResponse.json([])
    }
    const templates = await anyPrisma.template.findMany({ orderBy: { updatedAt: 'desc' } })
    return NextResponse.json(templates)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, subject, content } = await request.json()
    const anyPrisma: any = prisma as any
    if (!anyPrisma.template || typeof anyPrisma.template.create !== 'function') {
      return NextResponse.json({ error: 'Template model not yet migrated. Run prisma generate & db push.' }, { status: 400 })
    }
    const tpl = await anyPrisma.template.create({ data: { name, description, subject, content } })
    return NextResponse.json(tpl)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
