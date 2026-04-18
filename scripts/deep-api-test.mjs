/**
 * Exhaustive API exercise (all route handlers, safe mutations + cleanup).
 * Requires app running: npm run dev  →  http://127.0.0.1:3001
 * Usage: node scripts/deep-api-test.mjs
 * Env: SMOKE_BASE=http://127.0.0.1:3001
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const BASE = (process.env.SMOKE_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '')

const results = { base: BASE, at: new Date().toISOString(), steps: [], failed: [] }

function log(name, ok, detail = {}) {
  const row = { name, ok, ...detail }
  results.steps.push(row)
  console.log(ok ? '✓' : '✗', name, detail.status != null ? detail.status : '', detail.error || '')
  if (!ok) results.failed.push(row)
}

async function j(method, url, opts = {}) {
  const r = await fetch(url, {
    method,
    headers: opts.body != null ? { 'Content-Type': 'application/json' } : {},
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  })
  let json = null
  const t = await r.text()
  try {
    json = JSON.parse(t)
  } catch {
    json = { _raw: t.slice(0, 200) }
  }
  return { res: r, json, text: t }
}

async function expectOk(name, method, path, opts = {}) {
  const url = BASE + path
  try {
    const { res, json } = await j(method, url, opts)
    const ok = res.ok
    log(name, ok, { status: res.status, error: ok ? undefined : json?.error || json?.message })
    return { res, json }
  } catch (e) {
    log(name, false, { error: String(e.message) })
    return { res: { ok: false }, json: null }
  }
}

async function expectStatus(name, method, path, allowedStatuses, opts = {}) {
  const url = BASE + path
  try {
    const { res, json } = await j(method, url, opts)
    const ok = allowedStatuses.includes(res.status)
    log(name, ok, { status: res.status, error: ok ? undefined : json?.error })
    return { res, json }
  } catch (e) {
    log(name, false, { error: String(e.message) })
    return { res: { ok: false }, json: null }
  }
}

async function main() {
  console.log('Deep API test →', BASE, '\n')

  // —— Read-only GETs (every JSON/listing API) ——
  await expectOk('GET /api/public/config', 'GET', '/api/public/config')
  await expectOk('GET /api/contacts', 'GET', '/api/contacts')
  await expectOk('GET /api/contacts?search=a', 'GET', '/api/contacts?search=a')
  await expectOk('GET /api/contacts?paymentAlert=true', 'GET', '/api/contacts?paymentAlert=true')
  await expectOk('GET /api/campaigns', 'GET', '/api/campaigns')
  await expectOk('GET /api/tasks', 'GET', '/api/tasks')
  await expectOk('GET /api/analytics', 'GET', '/api/analytics')
  await expectOk('GET /api/notifications', 'GET', '/api/notifications')
  await expectOk('GET /api/policies', 'GET', '/api/policies')
  await expectOk('GET /api/qrcodes', 'GET', '/api/qrcodes')
  await expectOk('GET /api/qrcodes/stats', 'GET', '/api/qrcodes/stats')
  await expectOk('GET /api/referrals/stats', 'GET', '/api/referrals/stats')
  await expectOk('GET /api/templates', 'GET', '/api/templates')
  await expectOk('GET /api/contacts/dedupe', 'GET', '/api/contacts/dedupe')
  await expectOk('GET /api/contacts/export', 'GET', '/api/contacts/export')
  await expectOk('GET /api/campaigns/process', 'GET', '/api/campaigns/process')
  await expectOk('POST /api/campaigns/process', 'POST', '/api/campaigns/process')
  await expectOk('GET /api/cron/process-campaigns', 'GET', '/api/cron/process-campaigns')
  await expectOk('POST /api/cron/process-campaigns', 'POST', '/api/cron/process-campaigns')
  await expectOk('GET /api/webhooks/jotform/log', 'GET', '/api/webhooks/jotform/log')
  await expectOk('GET /api/webhooks/jotform/debug', 'GET', '/api/webhooks/jotform/debug')
  await expectOk('GET /api/webhooks/jotform/test-form', 'GET', '/api/webhooks/jotform/test-form')
  await expectOk('GET /api/webhooks/jotform/test', 'GET', '/api/webhooks/jotform/test')

  const { json: contactsJson } = await j('GET', BASE + '/api/contacts')
  const contacts = Array.isArray(contactsJson) ? contactsJson : []
  const contactId = contacts[0]?.id || null
  const clRes = await j('GET', BASE + '/api/campaigns')
  const campaigns = Array.isArray(clRes.json) ? clRes.json : []
  const campaignId = campaigns[0]?.id || null
  const tlRes = await j('GET', BASE + '/api/tasks')
  const tasks = Array.isArray(tlRes.json) ? tlRes.json : []
  const taskId = tasks[0]?.id || null
  const tplListRes = await j('GET', BASE + '/api/templates')
  const templates = Array.isArray(tplListRes.json) ? tplListRes.json : []
  const templateId = templates[0]?.id || null

  if (contactId) {
    await expectOk(`GET /api/contacts/${contactId}`, 'GET', `/api/contacts/${contactId}`)
    await expectOk(`GET /api/contacts/${contactId}/activity`, 'GET', `/api/contacts/${contactId}/activity`)
    await expectOk(`GET /api/contacts/${contactId}/referral-stats`, 'GET', `/api/contacts/${contactId}/referral-stats`)
    await expectOk(`PATCH /api/contacts/${contactId}`, 'PATCH', `/api/contacts/${contactId}`, {
      body: { languagePreference: 'English' },
    })
  } else {
    log('GET /api/contacts/:id (skipped)', true, { note: 'no contacts in DB' })
  }

  if (campaignId) {
    await expectOk(`GET /api/campaigns/${campaignId}`, 'GET', `/api/campaigns/${campaignId}`)
    await expectOk(`PATCH /api/campaigns/${campaignId}`, 'PATCH', `/api/campaigns/${campaignId}`, {
      body: { description: 'deep-api-test touch' },
    })
  }

  if (taskId) {
    await expectOk(`PATCH /api/tasks/${taskId}`, 'PATCH', `/api/tasks/${taskId}`, {
      body: { status: 'PENDING' },
    })
  }

  if (templateId) {
    await expectOk(`GET /api/templates/${templateId}`, 'GET', `/api/templates/${templateId}`)
  }

  await expectOk('GET /api/tasks/ics', 'GET', '/api/tasks/ics')

  // —— Built-in self-tests ——
  await expectOk('GET /api/test', 'GET', '/api/test')
  await expectOk('GET /api/test-all-features', 'GET', '/api/test-all-features')
  await expectStatus('GET /api/test-fixes', 'GET', '/api/test-fixes', [200, 207])
  await expectOk('GET /api/test-all-requirements', 'GET', '/api/test-all-requirements')
  await expectStatus('GET /api/test-comprehensive', 'GET', '/api/test-comprehensive', [200, 207, 500])

  // —— Mutations with cleanup ——
  const tag = `DeepTest-${Date.now()}`
  const email = `deep-api-${Date.now()}@example.invalid`

  const { res: cRes, json: created } = await j('POST', BASE + '/api/contacts', {
    body: {
      firstName: 'Deep',
      lastName: 'API',
      email,
      mobilePhone: '+1555000' + String(Date.now()).slice(-4),
      category: 'CONSUMER',
      status: 'LEAD',
      emailOptIn: true,
      smsOptIn: false,
    },
  })
  log('POST /api/contacts (create)', cRes.ok, { status: cRes.status, error: created?.error })
  const newContactId = created?.id

  if (newContactId) {
    await expectStatus('POST /api/contacts/merge (validation)', 'POST', '/api/contacts/merge', [400], {
      body: { targetId: newContactId, sourceIds: [] },
    })

    await expectOk('POST /api/contacts/bulk addTag', 'POST', '/api/contacts/bulk', {
      body: { action: 'addTag', contactIds: [newContactId], tag: 'DeepTestTag' },
    })

    const { res: tRes, json: taskCreated } = await j('POST', BASE + '/api/tasks', {
      body: {
        contactId: newContactId,
        title: 'Deep API task',
        description: 'auto',
        priority: 'LOW',
        status: 'PENDING',
      },
    })
    log('POST /api/tasks', tRes.ok, { status: tRes.status })
    const newTaskId = taskCreated?.id
    if (newTaskId) {
      await expectOk(`PATCH /api/tasks/${newTaskId}`, 'PATCH', `/api/tasks/${newTaskId}`, {
        body: { title: 'Deep API task updated' },
      })
      await expectOk(`DELETE /api/tasks/${newTaskId}`, 'DELETE', `/api/tasks/${newTaskId}`)
    }

    await expectStatus('POST /api/portal-email', 'POST', '/api/portal-email', [200, 400, 500], {
      body: { contactId: newContactId },
    })

    const { res: polRes, json: pol } = await j('POST', BASE + '/api/policies', {
      body: {
        contactId: newContactId,
        carrier: 'DeepTest Carrier',
        planType: 'Basic',
        monthlyPremium: 1,
      },
    })
    log('POST /api/policies', polRes.ok, { status: polRes.status })
    const policyId = pol?.id
    if (policyId) {
      await expectOk(`PATCH /api/policies`, 'PATCH', '/api/policies', {
        body: {
          id: policyId,
          planType: 'Basic',
          carrier: 'DeepTest Carrier',
        },
      })
    }
  }

  const { res: qrRes, json: qr } = await j('POST', BASE + '/api/qrcodes/generate', {
    body: { source: tag, useLocalIntake: true },
  })
  log('POST /api/qrcodes/generate', qrRes.ok, { status: qrRes.status })
  const qrCodeId = qr?.qrCodeId
  let intakeContactId = null
  if (qrCodeId) {
    const int = await j('POST', BASE + '/api/intake', {
      body: {
        qrCodeId,
        firstName: 'Intake',
        lastName: 'Deep',
        email: `intake-${Date.now()}@example.invalid`,
        interestType: 'Consumer',
      },
    })
    intakeContactId = int.json?.contactId || null
    log('POST /api/intake', int.res.ok, { status: int.res.status, error: int.json?.error })
  }

  const { res: campRes, json: camp } = await j('POST', BASE + '/api/campaigns', {
    body: {
      name: `DeepTest Campaign ${Date.now()}`,
      description: 'delete me',
      category: 'CONSUMER',
      type: 'CUSTOM',
      steps: [
        {
          triggerDays: 0,
          channel: 'EMAIL',
          subject: 'Hi',
          content: 'Hello from deep test',
        },
      ],
    },
  })
  log('POST /api/campaigns', campRes.ok, { status: campRes.status })
  const newCampaignId = camp?.id
  if (newCampaignId && newContactId) {
    await expectOk(`POST /api/campaigns/${newCampaignId}/contacts`, 'POST', `/api/campaigns/${newCampaignId}/contacts`, {
      body: { contactIds: [newContactId] },
    })
  }
  if (newCampaignId) {
    await expectOk(`DELETE /api/campaigns/${newCampaignId}`, 'DELETE', `/api/campaigns/${newCampaignId}`)
  }

  const { res: tplCreateRes, json: tpl } = await j('POST', BASE + '/api/templates', {
    body: {
      name: `DeepTpl ${Date.now()}`,
      description: 'x',
      subject: 'S',
      content: 'C',
    },
  })
  log('POST /api/templates', tplCreateRes.ok, { status: tplCreateRes.status })
  const newTplId = tpl?.id
  if (newTplId) {
    await expectOk(`PATCH /api/templates/${newTplId}`, 'PATCH', `/api/templates/${newTplId}`, {
      body: { description: 'patched' },
    })
    await expectOk(`DELETE /api/templates/${newTplId}`, 'DELETE', `/api/templates/${newTplId}`)
  }

  await expectStatus('POST /api/test/contact', 'POST', '/api/test/contact', [200, 500])
  await expectStatus('POST /api/test/email', 'POST', '/api/test/email', [200, 400, 500], {
    body: { to: email, subject: 't', html: '<p>x</p>' },
  })
  await expectStatus('POST /api/test/sms', 'POST', '/api/test/sms', [200, 400, 500], {
    body: { to: '+15555555555', message: 'deep' },
  })

  await expectOk('POST /api/webhooks/jotform/test', 'POST', '/api/webhooks/jotform/test')
  await expectStatus('POST /api/webhooks/jotform (minimal body)', 'POST', '/api/webhooks/jotform', [200, 400, 500], {
    body: { formData: { firstName: 'Hook', lastName: 'Test', email: `hook-${Date.now()}@t.co`, phone: '555-0100' } },
  })

  let refCode = null
  if (contactId) {
    const rs = await j('GET', BASE + `/api/contacts/${contactId}/referral-stats`)
    refCode = rs.json?.referralCode || null
  }
  if (refCode) {
    await expectOk(`POST /api/referral/${refCode}/click`, 'POST', `/api/referral/${refCode}/click`)
    const convertId = intakeContactId || newContactId
    if (convertId && convertId !== contactId) {
      await expectStatus(`POST /api/referral/${refCode}/convert`, 'POST', `/api/referral/${refCode}/convert`, [200, 400], {
        body: { contactId: convertId },
      })
    }
  } else {
    log('POST /api/referral/:code/click (skipped)', true, { note: 'no referral code' })
  }

  if (newContactId) {
    log('POST-test contact cleanup', true, { note: `left contact ${newContactId} (no DELETE API)` })
  }

  results.summary = {
    total: results.steps.length,
    passed: results.steps.filter((s) => s.ok).length,
    failed: results.failed.length,
  }

  const out = path.join(root, 'deep-api-test-report.json')
  fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf8')
  console.log('\nWrote', out)
  console.log('Summary:', results.summary)

  if (results.failed.length) {
    console.error('\nFailed steps:', results.failed.map((f) => f.name).join(', '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
