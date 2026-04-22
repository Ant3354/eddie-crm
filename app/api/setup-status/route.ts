import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      databaseUrl: Boolean(process.env.DATABASE_URL),
      encryptionKey: Boolean(
        process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32
      ),
      smtp: Boolean(process.env.SMTP_HOST || process.env.SMTP_FROM),
      twilio: Boolean(process.env.TWILIO_ACCOUNT_SID),
      cronSecret: Boolean(process.env.CRON_SECRET),
      sessionSecret: Boolean(
        process.env.EDDIE_SESSION_SECRET ||
          (process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 16)
      ),
      hasUsers: userCount > 0,
      requireLogin: process.env.EDDIE_REQUIRE_LOGIN === 'true',
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
