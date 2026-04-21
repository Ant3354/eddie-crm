/**
 * Idempotent: ensure Dental form has CRM webhook + hidden qr_code_id (URL prefill).
 * Requires JOTFORM_API_KEY and JOTFORM_FORM_ID (dental form) in env, e.g.:
 *   node --env-file=.env.local scripts/configure-jotform-dental-form.mjs
 */
const BASE = (process.env.JOTFORM_API_BASE || 'https://api.jotform.com').replace(/\/$/, '')
const KEY = process.env.JOTFORM_API_KEY?.trim()
const FORM_ID = (process.env.JOTFORM_FORM_ID || '253266939811163').trim()
const WEBHOOK_URL = (process.env.JOTFORM_WEBHOOK_URL || 'https://eddie-crm-khaki.vercel.app/api/webhooks/jotform').trim()

function headers() {
  return { APIKEY: KEY }
}

async function jf(path, opts = {}) {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, { ...opts, headers: { ...headers(), ...opts.headers } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.message || data.error || res.statusText
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${msg}`)
  }
  return data
}

function hasWebhook(content) {
  if (!content || typeof content !== 'object') return false
  const want = WEBHOOK_URL.toLowerCase()
  for (const v of Object.values(content)) {
    if (typeof v === 'string' && v.toLowerCase().includes(want.replace(/\/$/, ''))) return true
  }
  return false
}

function findQrField(questionsContent) {
  if (!questionsContent || typeof questionsContent !== 'object') return null
  for (const [qid, q] of Object.entries(questionsContent)) {
    if (!q || typeof q !== 'object') continue
    const name = String(q.name || '').toLowerCase()
    const text = String(q.text || '').toLowerCase()
    if (name === 'qr_code_id' || text === 'qr_code_id') return { qid, q }
  }
  return null
}

async function main() {
  if (!KEY) {
    console.error('Missing JOTFORM_API_KEY')
    process.exit(1)
  }
  console.log('Form:', FORM_ID, 'Webhook target:', WEBHOOK_URL)

  const wh = await jf(`/form/${encodeURIComponent(FORM_ID)}/webhooks`)
  const whContent = wh.content
  if (hasWebhook(whContent)) {
    console.log('Webhook already present for CRM URL.')
  } else {
    const body = new URLSearchParams()
    body.set('webhookURL', WEBHOOK_URL)
    await jf(`/form/${encodeURIComponent(FORM_ID)}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    console.log('Webhook added.')
  }

  const qs = await jf(`/form/${encodeURIComponent(FORM_ID)}/questions`)
  const qContent = qs.content
  if (findQrField(qContent)) {
    console.log('Hidden field qr_code_id already exists.')
  } else {
    const body = new URLSearchParams()
    body.set('question[type]', 'control_hidden')
    body.set('question[text]', 'qr_code_id')
    body.set('question[name]', 'qr_code_id')
    const created = await jf(`/form/${encodeURIComponent(FORM_ID)}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    console.log('Added hidden qr_code_id field:', created.message || 'ok')
  }

  console.log('Done. In JotForm builder, confirm the hidden field is first or early so URL ?qr_code_id=… prefill applies.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
