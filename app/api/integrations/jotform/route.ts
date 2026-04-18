import { NextResponse } from 'next/server'
import {
  getJotformApiKey,
  fetchJotformUser,
  fetchJotformForms,
  fetchJotformSubmissions,
} from '@/lib/jotform-client'

/**
 * GET — test JotForm API key (server-side only). Never returns the API key.
 */
export async function GET() {
  if (!getJotformApiKey()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        'Set JOTFORM_API_KEY in .env.local (dev) or Vercel → Environment Variables, then redeploy.',
    })
  }

  try {
    const user = await fetchJotformUser()
    const forms = await fetchJotformForms(30)
    const formId = process.env.JOTFORM_FORM_ID?.trim() || forms[0]?.id

    let submissionsPreview: {
      formId: string
      count: number
      sampleIds: string[]
    } | null = null

    if (formId) {
      const { submissions } = await fetchJotformSubmissions(formId, 3)
      submissionsPreview = {
        formId,
        count: submissions.length,
        sampleIds: submissions.map((s) => String(s.id || '')).filter(Boolean),
      }
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      connected: true,
      user: {
        name: user.name ?? null,
        email: user.email ?? null,
        username: user.username ?? null,
        accountType: user.account_type_name ?? null,
        timeZone: user.time_zone ?? null,
      },
      forms: forms.slice(0, 15).map((f) => ({
        id: f.id,
        title: f.title ?? '(untitled)',
        status: f.status ?? null,
        url: f.url ?? null,
      })),
      formsTotal: forms.length,
      submissionsPreview,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        connected: false,
        message,
      },
      { status: 502 }
    )
  }
}
