import { test, expect } from '@playwright/test'

/** Every app route (client pages). */
const PAGE_PATHS = [
  '/',
  '/dashboard',
  '/contacts',
  '/contacts/new',
  '/contacts/merge',
  '/contacts/import',
  '/campaigns',
  '/campaigns/new',
  '/tasks',
  '/qrcodes',
  '/integrations',
  '/pipeline',
  '/templates',
  '/templates/new',
  '/test',
  '/intake',
]

function attachErrorCollector(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  return errors
}

test.describe('Full UI deep pass', () => {
  for (const path of PAGE_PATHS) {
    test(`loads ${path || '/'} without React hard-crash`, async ({ page }) => {
      const errors = attachErrorCollector(page)
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(res?.ok() || res?.status() === 304, `HTTP ${res?.status()} for ${path}`).toBeTruthy()
      await expect(page.locator('body')).toBeVisible()
      const fatal = errors.filter(
        (e) =>
          !e.includes('favicon') &&
          !e.includes('ResizeObserver') &&
          !e.includes('Non-Error promise rejection') &&
          !e.includes('#418') &&
          !e.includes('#423') &&
          !e.includes('#425')
      )
      expect(fatal, `Errors on ${path}: ${fatal.join('\n')}`).toHaveLength(0)
    })
  }

  test('home → Open dashboard CTA', async ({ page }) => {
    const errors = attachErrorCollector(page)
    await page.goto('/')
    await page.getByRole('link', { name: /Open dashboard/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
    expect(errors.filter((e) => !e.includes('favicon') && !e.includes('#418') && !e.includes('#423'))).toHaveLength(0)
  })

  test('primary nav: every top link navigates', async ({ page }) => {
    const errors = attachErrorCollector(page)
    await page.goto('/dashboard')
    const nav = page.getByRole('navigation')
    const links: { name: RegExp; path: RegExp }[] = [
      { name: /EDDIE CRM/i, path: /\// },
      { name: /^Dashboard$/, path: /\/dashboard/ },
      { name: /^Contacts$/, path: /\/contacts$/ },
      { name: /^Merge$/, path: /\/contacts\/merge/ },
      { name: /^Campaigns$/, path: /\/campaigns$/ },
      { name: /^Tasks$/, path: /\/tasks/ },
      { name: /^QR Codes$/, path: /\/qrcodes/ },
      { name: /^Integrations$/, path: /\/integrations/ },
      { name: /^Tests$/, path: /\/test/ },
      { name: /^Pipeline$/, path: /\/pipeline/ },
      { name: /^Templates$/, path: /\/templates$/ },
    ]
    for (const { name, path } of links) {
      await nav.getByRole('link', { name }).first().click()
      await expect(page).toHaveURL(path)
      await expect(page.locator('body')).toBeVisible()
    }
    expect(errors.filter((e) => !e.includes('favicon') && !e.includes('#418') && !e.includes('#423'))).toHaveLength(0)
  })

  test('dashboard stat shortcuts', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /View all/i }).click()
    await expect(page).toHaveURL(/\/contacts/)
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /View alerts/i }).click()
    await expect(page).toHaveURL(/\/contacts\?paymentAlert=true/)
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /View campaigns/i }).click()
    await expect(page).toHaveURL(/\/campaigns/)
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /View tasks/i }).click()
    await expect(page).toHaveURL(/\/tasks/)
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /View QR codes/i }).click()
    await expect(page).toHaveURL(/\/qrcodes/)
  })

  test('quick search opens and submits', async ({ page }) => {
    await page.goto('/contacts')
    await page.getByTitle(/Quick Search/i).click()
    await page.getByPlaceholder(/Quick search contacts/i).fill('a')
    await page.locator('form').filter({ has: page.getByPlaceholder(/Quick search contacts/i) }).press('Enter')
    await expect(page).toHaveURL(/\/contacts\?search=/)
  })

  test('command palette: open, filter, run navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Command/i }).click()
    await page.getByPlaceholder(/Type a command/i).fill('contacts')
    await page.getByRole('button', { name: /Go to Contacts/i }).click()
    await expect(page).toHaveURL(/\/contacts/)
  })

  test('notifications bell opens dropdown', async ({ page }) => {
    await page.goto('/dashboard')
    // nav buttons order: Quick search, Command, Notifications, Theme
    await page.locator('nav >> button').nth(2).click()
    await expect(page.getByRole('heading', { name: /^Notifications$/ })).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('theme toggle switches', async ({ page }) => {
    await page.goto('/dashboard')
    const themeBtn = page.getByRole('button', { name: /🌙|☀️/ })
    await themeBtn.waitFor({ state: 'visible' })
    await themeBtn.click()
    await page.waitForTimeout(200)
    await themeBtn.click()
  })

  test('contacts: New Contact + Import links', async ({ page }) => {
    await page.goto('/contacts')
    await page.getByRole('link', { name: /New Contact/i }).first().click()
    await expect(page).toHaveURL(/\/contacts\/new/)
    await page.goto('/contacts')
    await page.getByRole('link', { name: /Import/i }).first().click()
    await expect(page).toHaveURL(/\/contacts\/import/)
  })

  test('contacts: open first contact detail when list non-empty', async ({ page }) => {
    await page.goto('/contacts')
    const detail = page.getByRole('link', { name: /View Details/i }).first()
    if (await detail.count()) {
      await detail.click()
      await expect(page).toHaveURL(/\/contacts\/[^/]+$/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })

  test('test runner page: basic API from UI', async ({ page }) => {
    await page.goto('/test')
    const waitBasic = page.waitForResponse((r) => r.url().includes('/api/test') && r.request().method() === 'GET', {
      timeout: 120_000,
    })
    await page.getByRole('button', { name: /Run Tests/i }).click()
    await waitBasic
    await expect(page.getByText('Test Summary', { exact: true })).toBeVisible()
    await expect(page.getByText('Test Results', { exact: true })).toBeVisible()
  })

  test('test runner page: requirements suite from UI', async ({ page }) => {
    test.setTimeout(360_000)
    await page.goto('/test')
    await page.locator('select').selectOption('requirements')
    const waitReq = page.waitForResponse(
      (r) => r.url().includes('/api/test-all-requirements') && r.request().method() === 'GET',
      { timeout: 330_000 }
    )
    await page.getByRole('button', { name: /Run Tests/i }).click()
    await waitReq
    await expect(page.getByText('Test Summary', { exact: true })).toBeVisible({ timeout: 30_000 })
  })

  test('QR page: select source + Generate QR Code', async ({ page, request }) => {
    const gen = await request.post('/api/qrcodes/generate', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ source: 'Airport', useLocalIntake: true }),
    })
    expect(gen.ok()).toBeTruthy()
    const { qrCodeId } = (await gen.json()) as { qrCodeId: string }
    expect(qrCodeId).toBeTruthy()
    const listRes = await request.get('/api/qrcodes')
    expect(listRes.ok()).toBeTruthy()
    const list = (await listRes.json()) as Array<{ id: string }>
    expect(list.some((q) => q.id === qrCodeId), 'new QR id should appear in GET /api/qrcodes').toBe(true)
    await page.goto('/qrcodes', { waitUntil: 'load' })
    await expect(page.getByText(qrCodeId)).toBeVisible({ timeout: 30_000 })
    await page.getByText(qrCodeId).click()
    await expect(page.locator('img[alt="QR Code"]').first()).toBeVisible({ timeout: 20_000 })
  })

  test('intake form submit (with qr from API)', async ({ page, request }) => {
    const gen = await request.post('/api/qrcodes/generate', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ source: 'e2e-playwright', useLocalIntake: true }),
    })
    expect(gen.ok()).toBeTruthy()
    const body = await gen.json()
    const qrCodeId = body.qrCodeId as string
    expect(qrCodeId).toBeTruthy()
    await page.goto(`/intake?qr_code_id=${encodeURIComponent(qrCodeId)}`, { waitUntil: 'load' })
    await expect(page).toHaveURL(new RegExp(`qr_code_id=${qrCodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    const form = page.locator('main form')
    await expect(form).toBeVisible({ timeout: 30_000 })
    await form.locator('input').nth(0).fill('E2E')
    await form.locator('input').nth(1).fill('User')
    await form.locator('input[type="email"]').fill(`e2e-${Date.now()}@example.invalid`)
    const intakePost = page.waitForResponse(
      (r) => r.url().includes('/api/intake') && r.request().method() === 'POST',
      { timeout: 30_000 }
    )
    await page.getByRole('button', { name: /^Submit$/i }).click()
    const intakeRes = await intakePost
    expect(intakeRes.ok(), `intake HTTP ${intakeRes.status()} ${await intakeRes.text()}`).toBeTruthy()
    await expect(page.getByRole('button', { name: /Download PDF summary/i })).toBeVisible({ timeout: 30_000 })
  })

  test('campaigns new: add step row + UI present', async ({ page }) => {
    await page.goto('/campaigns/new')
    await expect(page.getByRole('heading', { name: /New Campaign/i })).toBeVisible()
    await page.getByRole('button', { name: /Add Step/i }).click()
    await expect(page.getByText(/Campaign Steps \(2\)/)).toBeVisible()
  })

  test('templates new page form visible', async ({ page }) => {
    await page.goto('/templates/new')
    await expect(page.locator('input, textarea').first()).toBeVisible()
  })

  test('referral landing page (404 ok if code missing)', async ({ page }) => {
    const res = await page.goto('/referral/INVALIDCODE999', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('campaign detail page (dynamic)', async ({ page, request }) => {
    const r = await request.get('/api/campaigns')
    const list = await r.json()
    const id = Array.isArray(list) ? list[0]?.id : null
    if (!id) return
    await page.goto(`/campaigns/${id}`)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('template edit page (dynamic)', async ({ page, request }) => {
    const r = await request.get('/api/templates')
    const list = await r.json()
    const id = Array.isArray(list) ? list[0]?.id : null
    if (!id) return
    await page.goto(`/templates/${id}`)
    await expect(page.locator('body')).toBeVisible()
  })
})
