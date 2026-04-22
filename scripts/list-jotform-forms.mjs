/**
 * Print all form IDs + titles for your JotForm account (pick dental vs clinic IDs for .env).
 *
 * Usage (from repo root, Node 20+):
 *   node --env-file=.env scripts/list-jotform-forms.mjs
 *   node --env-file=.env.local scripts/list-jotform-forms.mjs
 *
 * Then set in .env / Vercel:
 *   JOTFORM_FORM_ID_DENTAL=<id>
 *   JOTFORM_FORM_ID_CLINIC=<id>
 */
const key = process.env.JOTFORM_API_KEY?.trim()
if (!key) {
  console.error('Missing JOTFORM_API_KEY. Set it in .env then run:')
  console.error('  node --env-file=.env scripts/list-jotform-forms.mjs')
  process.exit(1)
}

const base = (process.env.JOTFORM_API_BASE || 'https://api.jotform.com').replace(/\/$/, '')
const headers = { APIKEY: key }

function normalizeFormsPayload(json) {
  const content = json?.content
  if (Array.isArray(content)) return content
  if (content && typeof content === 'object') {
    return Object.values(content).filter((x) => x && typeof x === 'object' && x.id)
  }
  return []
}

async function fetchPage(offset, limit) {
  const url = `${base}/user/forms?offset=${offset}&limit=${limit}`
  const res = await fetch(url, { headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json.message || json.error || res.statusText
    const hint =
      res.status === 401
        ? ' (Check JOTFORM_API_KEY in .env — must be a valid key from https://www.jotform.com/myaccount/api )'
        : ''
    throw new Error(`GET /user/forms → ${res.status}: ${msg}${hint}`)
  }
  if (json.responseCode && json.responseCode !== 200) {
    throw new Error(json.message || String(json.responseCode))
  }
  return normalizeFormsPayload(json)
}

async function main() {
  const limit = 100
  let offset = 0
  const rows = []
  for (;;) {
    const page = await fetchPage(offset, limit)
    if (!page.length) break
    for (const f of page) {
      const id = String(f.id || '').trim()
      const title = String(f.title || f.name || '(no title)').trim()
      const url = f.url ? String(f.url) : ''
      if (id) rows.push({ id, title, url })
    }
    if (page.length < limit) break
    offset += limit
  }

  rows.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))

  console.log(`Found ${rows.length} form(s).\n`)
  console.log('Paste into .env (or Vercel env):\n')
  for (const r of rows) {
    console.log(`# ${r.title}`)
    if (r.url) console.log(`# ${r.url}`)
    console.log(`# id: ${r.id}`)
    console.log('')
  }
  console.log('Example (replace with your real IDs):')
  console.log('JOTFORM_FORM_ID_DENTAL=xxxxxxxxxxxxxxx')
  console.log('JOTFORM_FORM_ID_CLINIC=yyyyyyyyyyyyyyy')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
