import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const anyPrisma: any = prisma as any
  if (!anyPrisma.template || typeof anyPrisma.template.findUnique !== 'function') {
    return NextResponse.json({ error: 'Template model not available' }, { status: 400 })
  }
  const tpl = await anyPrisma.template.findUnique({ where: { id: params.id } })
  if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tpl)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const anyPrisma: any = prisma as any
    if (!anyPrisma.template || typeof anyPrisma.template.update !== 'function') {
      return NextResponse.json({ error: 'Template model not available' }, { status: 400 })
    }
    const body = await request.json()
    const tpl = await anyPrisma.template.update({ where: { id: params.id }, data: body })
    return NextResponse.json(tpl)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const anyPrisma: any = prisma as any
    if (!anyPrisma.template || typeof anyPrisma.template.delete !== 'function') {
      return NextResponse.json({ error: 'Template model not available' }, { status: 400 })
    }
    await anyPrisma.template.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
