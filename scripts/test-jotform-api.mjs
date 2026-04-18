/**
 * Quick check against Jotform REST API (no Next.js server).
 * Usage: set JOTFORM_API_KEY then: node scripts/test-jotform-api.mjs
 */
const key = process.env.JOTFORM_API_KEY?.trim()
if (!key) {
  console.error('Set JOTFORM_API_KEY in the environment, then run again.')
  process.exit(1)
}
const base = (process.env.JOTFORM_API_BASE || 'https://api.jotform.com').replace(/\/$/, '')
const headers = { APIKEY: key }

async function main() {
  const userRes = await fetch(`${base}/user`, { headers })
  const userJson = await userRes.json()
  console.log('GET /user status:', userRes.status, 'responseCode:', userJson.responseCode)

  const formsRes = await fetch(`${base}/user/forms?limit=5`, { headers })
  const formsJson = await formsRes.json()
  console.log('GET /user/forms status:', formsRes.status, 'responseCode:', formsJson.responseCode)

  const content = formsJson.content
  const list = Array.isArray(content)
    ? content
    : content && typeof content === 'object'
      ? Object.values(content).filter((x) => x && typeof x === 'object' && x.id)
      : []
  console.log('Form count (sample):', list.length)
  if (list[0]?.id) {
    const sid = list[0].id
    const subRes = await fetch(`${base}/form/${sid}/submissions?limit=2`, { headers })
    const subJson = await subRes.json()
    console.log('GET /form/.../submissions status:', subRes.status, 'responseCode:', subJson.responseCode)
  }
  if (!userRes.ok || userJson.responseCode && userJson.responseCode !== 200) {
    console.error('User endpoint error:', userJson.message || userJson)
    process.exit(1)
  }
  console.log('OK — API key can read account data.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
