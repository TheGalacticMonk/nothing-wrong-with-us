import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { creds, login, tinyPng, writable } from './support/api'
import { BASE_URL } from './support/site'

/**
 * The client's main journey, as the EDITOR, in the browser:
 * log in → Home → change a paragraph → replace the portrait → see it in Live Preview → Publish →
 * public page updates (timed) → add a collage piece → reorder → verify /collage-art.
 * Counts clicks, records timings to test-results/qa/cms/journey-<host>.json, restores everything.
 */
test.describe.configure({ mode: 'serial' })
test.setTimeout(300_000)

const MARK = `QA journey ${Date.now()}`
const out = path.resolve('test-results/qa/cms')
fs.mkdirSync(out, { recursive: true })
const report: Record<string, unknown> = { base: BASE_URL, steps: [] as unknown[] }
let clicks = 0
let admin: Awaited<ReturnType<typeof login>>
let homeSnapshot: Record<string, unknown>
const created: { collection: string; id: number }[] = []

const click = async (l: Locator) => {
  clicks++
  await l.click()
}
const step = (name: string, extra: Record<string, unknown> = {}) =>
  (report.steps as unknown[]).push({ name, clicks, at: new Date().toISOString(), ...extra })

test.beforeAll(async ({ request }) => {
  test.skip(!creds.editor.email || !creds.admin.email, 'credentials not set')
  admin = await login(request, creds.admin)
  homeSnapshot = await (await request.get(`${BASE_URL}/api/globals/home-page?depth=0`, admin)).json()
})

test.afterAll(async ({ request }) => {
  fs.writeFileSync(path.join(out, `journey-${new URL(BASE_URL).port || 'default'}.json`), JSON.stringify(report, null, 2))
  if (!admin) return
  const r = await request.post(`${BASE_URL}/api/globals/home-page?depth=0`, {
    ...admin,
    data: { ...writable(homeSnapshot), _status: 'published' },
  })
  expect(r.ok(), 'restore home-page').toBeTruthy()
  for (const { collection, id } of created.reverse()) {
    await request.delete(`${BASE_URL}/api/${collection}/${id}`, admin)
  }
  // Uploaded media from the portrait drawer.
  const media = await (await request.get(`${BASE_URL}/api/media?where[alt][like]=${encodeURIComponent('QA journey')}&depth=0`, admin)).json()
  for (const m of media.docs ?? []) await request.delete(`${BASE_URL}/api/media/${m.id}`, admin)
})

const waitForPublic = async (page: Page, pathName: string, predicate: (html: string) => boolean) => {
  const t0 = Date.now()
  for (;;) {
    const html = await (await page.request.get(BASE_URL + pathName, { headers: { Cookie: '' } })).text()
    if (predicate(html)) return Date.now() - t0
    if (Date.now() - t0 > 60_000) return -1
    await page.waitForTimeout(250)
  }
}

test('edit Home, replace portrait, Live Preview, Publish, public update', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE_URL}/admin`)
  await page.fill('#field-email', creds.editor.email)
  await page.fill('#field-password', creds.editor.password)
  await click(page.locator('button[type="submit"]'))
  await page.waitForURL(/\/admin\/?$/)
  step('logged in')

  await click(page.getByRole('link', { name: /Edit the Home page/ }))
  await page.waitForURL(/globals\/home-page/)
  const preview = page.frameLocator('iframe').first()
  await expect(preview.locator('main')).toBeVisible({ timeout: 60_000 })
  step('home editor open with live preview')

  await click(page.getByText('About Becca', { exact: true }).first())
  const text = page.getByLabel('Text', { exact: true })
  await text.fill(`${MARK}: a new paragraph.`)
  const t0 = Date.now()
  await expect(preview.getByText(`${MARK}: a new paragraph.`)).toBeVisible({ timeout: 30_000 })
  step('paragraph visible in live preview', { ms: Date.now() - t0 })

  // Anonymous visitors must not see the unpublished draft.
  expect(await waitForPublic(page, '/', (h) => !h.includes(MARK))).toBeGreaterThanOrEqual(0)

  await click(page.getByRole('button', { name: 'Remove' }).nth(0))
  await click(page.getByRole('button', { name: 'Add new' }).first())
  await page.locator('input[type=file]').last().setInputFiles({ name: `qa-portrait-${Date.now()}.png`, mimeType: 'image/png', buffer: tinyPng([30, 160, 90]) })
  // The drawer's "Image description" input has no accessible name (label not associated), so select by name.
  await page.locator('dialog input[name="alt"]').last().fill(`${MARK} portrait`)
  await click(page.getByRole('button', { name: 'Save', exact: true }).last())
  await expect(page.getByText(/qa-portrait-/).first()).toBeVisible({ timeout: 30_000 })
  const t1 = Date.now()
  await expect(preview.locator(`img[alt="${MARK} portrait"]`)).toBeVisible({ timeout: 30_000 })
  step('new portrait visible in live preview', { ms: Date.now() - t1 })

  await click(page.getByRole('button', { name: 'Publish changes' }))
  const published = Date.now()
  await expect(page.getByText(/published|updated successfully/i).first()).toBeVisible({ timeout: 30_000 })
  const ms = await waitForPublic(page, '/', (h) => h.includes(MARK) && h.includes(`${MARK} portrait`))
  report.publishToPublicMs = ms
  report.publishToPublicTotalMs = Date.now() - published
  step('published; public / updated', { ms })
  expect(ms, 'public page updates after Publish').toBeGreaterThanOrEqual(0)

  const ctx = await browser.newContext()
  const visitor = await ctx.newPage()
  await visitor.goto(`${BASE_URL}/`)
  await expect(visitor.getByText(`${MARK}: a new paragraph.`)).toBeVisible()
  await expect(visitor.locator(`img[alt="${MARK} portrait"]`)).toBeVisible()
  await ctx.close()
})

test('add a collage piece, reorder it to the top, verify /collage-art', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#field-email', creds.editor.email)
  await page.fill('#field-password', creds.editor.password)
  await click(page.locator('button[type="submit"]'))
  await page.waitForURL(/\/admin\/?$/)
  const before = clicks

  await click(page.getByRole('link', { name: /Add a collage piece/ }))
  await page.waitForURL(/collections\/collage\/create/)
  await page.locator('input[type=file]').first().setInputFiles({ name: `qa-collage-${Date.now()}.png`, mimeType: 'image/png', buffer: tinyPng([240, 200, 20]) })
  clicks++ // choosing the file
  await page.getByLabel(/Image description/).fill(`${MARK} collage`)
  await click(page.getByRole('button', { name: 'Publish changes' }))
  await page.waitForURL(/collections\/collage\/\d+/, { timeout: 60_000 })
  const id = Number(page.url().match(/collage\/(\d+)/)![1])
  created.push({ collection: 'collage', id })
  step('collage piece published', { id, clicksForThis: clicks - before })

  // New pieces go to the end.
  const t0 = Date.now()
  const lastAlt = await (async () => {
    for (;;) {
      const html = await (await page.request.get(`${BASE_URL}/collage-art`, { headers: { Cookie: '' } })).text()
      const alts = [...html.matchAll(/<button[^>]*aria-haspopup="dialog"[^>]*>\s*<img[^>]*alt="([^"]*)"/g)].map((m) => m[1])
      if (alts.includes(`${MARK} collage`) || Date.now() - t0 > 60_000) return alts.at(-1)
      await page.waitForTimeout(250)
    }
  })()
  expect(lastAlt).toBe(`${MARK} collage`)
  step('new piece appears last on /collage-art', { ms: Date.now() - t0 })

  // Reorder: dashboard link → list → drag the new piece to the top.
  await page.goto(`${BASE_URL}/admin`)
  await click(page.getByRole('link', { name: /See all pieces or reorder/ }))
  await page.waitForURL(/collections\/collage/)
  const rows = page.locator('tbody tr')
  await expect(rows.first()).toBeVisible()
  // USABILITY: the list shows 10 per page and new pieces are added last (#23 → page 3). Drag only
  // works within a page, so the editor must first raise "Per Page" (not mentioned anywhere).
  report.newPieceOnFirstPage = (await rows.filter({ hasText: `${MARK} collage` }).count()) > 0
  if (!report.newPieceOnFirstPage) {
    await click(page.getByText(/Per Page:/).first())
    await click(page.getByRole('button', { name: '50', exact: true }).first())
    await page.waitForURL(/limit=50/)
    await expect(rows).toHaveCount(23)
  }
  const count = await rows.count()
  const handle = (row: Locator) => row.locator('[aria-roledescription=sortable]').first()
  const newRow = rows.filter({ hasText: `${MARK} collage` })
  await expect(newRow, 'new piece visible in the list').toHaveCount(1)
  // A real drag from the bottom of a long list: grab the handle, hold at the top edge so the list
  // auto-scrolls, then drop above the first row.
  const h = handle(newRow)
  await h.scrollIntoViewIfNeeded()
  const box = (await h.boundingBox())!
  const x = box.x + box.width / 2
  await page.mouse.move(x, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(x, box.y - 20, { steps: 5 })
  for (let i = 0; i < 60; i++) {
    await page.mouse.move(x, 30 + (i % 2))
    await page.waitForTimeout(80)
  }
  const first = (await handle(rows.first()).boundingBox())!
  const reorder = page.waitForResponse((r) => r.url().includes('/api/reorder'))
  await page.mouse.move(x, first.y - 40, { steps: 10 })
  await page.waitForTimeout(300)
  await page.mouse.up()
  expect((await reorder).ok()).toBeTruthy()
  clicks++ // one drag
  step('dragged to top in list', { rowsOnPage: count })

  const t1 = Date.now()
  let firstAlt: string | undefined
  for (;;) {
    const html = await (await page.request.get(`${BASE_URL}/collage-art`, { headers: { Cookie: '' } })).text()
    firstAlt = [...html.matchAll(/aria-haspopup="dialog"[^>]*>\s*<img[^>]*alt="([^"]*)"/g)].map((m) => m[1])[0]
    if (firstAlt === `${MARK} collage` || Date.now() - t1 > 60_000) break
    await page.waitForTimeout(250)
  }
  report.reorderToPublicMs = Date.now() - t1
  expect(firstAlt).toBe(`${MARK} collage`)
  step('new piece first on /collage-art', { ms: Date.now() - t1 })
  report.totalClicks = clicks
})
