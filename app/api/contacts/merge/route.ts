import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { targetId, sourceIds } = await request.json()
    if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json({ error: 'targetId and sourceIds required' }, { status: 400 })
    }

    // Move related records from sources to target
    await prisma.$transaction(async (tx) => {
      await tx.policy.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } })
      await tx.task.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } })
      await tx.file.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } }).catch(()=>{})
      await tx.emailLog.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } })
      await tx.smsLog.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } })
      await tx.contactTag.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } })
      await tx.campaignContact.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } })
      await tx.referralLink.updateMany({ where: { contactId: { in: sourceIds } }, data: { contactId: targetId } }).catch(()=>{})

      // Delete sources
      await tx.contact.deleteMany({ where: { id: { in: sourceIds } } })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
