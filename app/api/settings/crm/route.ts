import { NextRequest, NextResponse } from 'next/server'
import {
  getCrmSettings,
  saveCrmSettings,
  parseCrmSettingsJson,
  mergeCrmSettingsPatch,
  type CrmSettingsShape,
} from '@/lib/crm-settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { settings } = await getCrmSettings()
    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CrmSettingsShape>
    const { settings: existing } = await getCrmSettings()
    const merged = mergeCrmSettingsPatch(existing, body)
    const parsed = parseCrmSettingsJson(JSON.stringify(merged))
    await saveCrmSettings(parsed)
    return NextResponse.json({ success: true, settings: parsed })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
