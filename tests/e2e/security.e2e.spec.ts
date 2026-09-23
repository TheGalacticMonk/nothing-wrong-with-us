import { expect, test, type APIRequestContext } from '@playwright/test'

import { creds, login, tinyPng, writable } from './support/api'
import { BASE_URL } from './support/site'

/**
 * Drafts, preview, roles, anonymous writes, lockout, headers.
 * Restores everything it changes (global re-published from its snapshot; test items deleted).
 */
test.describe.configure({ mode: 'serial' })

const MARK = `QA-DRAFT-${Date.now()}`
let admin: Awaited<ReturnType<typeof login>>
let homeSnapshot: Record<string, unknown>
let collageSnapshot: Record<string, unknown>
let publishedCollageId: number
let draftCollageId: number | undefined

const anon = async (request: APIRequestContext, path: string) => {
  const res = await request.get(BASE_URL + path, { headers: { Cookie: '' } })
  return { status: res.status(), text: await res.text() }
}

test.beforeAll(async ({ request }) => {
  test.skip(!creds.admin.email || !creds.editor.email, 'SEED_ADMIN_* / SEED_EDITOR_* not set')
  admin = await login(request, creds.admin)
  homeSnapshot = await (await request.get(`${BASE_URL}/api/globals/home-page?depth=0`, admin)).json()
  const list = await (await request.get(`${BASE_URL}/api/collage?depth=0&limit=1&sort=_order`, admin)).json()
  collageSnapshot = list.docs[0]
  publishedCollageId = list.docs[0].id
})

test.afterAll(async ({ request }) => {
  if (!admin) return
  // Re-publish the snapshots (clears the draft layered on top).
  if (homeSnapshot) {
    const r = await request.post(`${BASE_URL}/api/globals/home-page?depth=0`, {
      ...admin,
      data: { ...writable(homeSnapshot), _status: 'published' },
    })
    expect(r.ok(), `restore home-page: ${r.status()}`).toBeTruthy()
  }
  if (collageSnapshot) {
    const { alt, title, year } = collageSnapshot as { alt: string; title: string | null; year: number | null }
    const r = await request.patch(`${BASE_URL}/api/collage/${publishedCollageId}?depth=0`, {
      ...admin,
      data: { alt, title, year, _status: 'published' },
    })
    expect(r.ok(), `restore collage: ${r.status()}`).toBeTruthy()
  }
  if (draftCollageId) await request.delete(`${BASE_URL}/api/collage/${draftCollageId}`, admin)
})

test('set up drafts: global draft, draft edit of a published piece, brand-new draft piece', async ({ request }) => {
  const g = await request.post(`${BASE_URL}/api/globals/home-page?draft=true`, {
    ...admin,
    data: { leadIn: `${MARK} lead-in`, _status: 'draft' },
  })
  expect(g.ok(), await g.text()).toBeTruthy()

  const c = await request.patch(`${BASE_URL}/api/collage/${publishedCollageId}?draft=true`, {
    ...admin,
    data: { alt: `${MARK} alt edit`, _status: 'draft' },
  })
  expect(c.ok(), await c.text()).toBeTruthy()

  const n = await request.post(`${BASE_URL}/api/collage?draft=true`, {
    ...admin,
    multipart: {
      file: { name: `qa-draft-${Date.now()}.png`, mimeType: 'image/png', buffer: tinyPng() },
      _payload: JSON.stringify({ alt: `${MARK} new piece`, _status: 'draft' }),
    },
  })
  expect(n.ok(), await n.text()).toBeTruthy()
  draftCollageId = (await n.json()).doc.id

  // Sanity: the signed-in admin does see the drafts.
  const seen = await (await request.get(`${BASE_URL}/api/globals/home-page?draft=true`, admin)).text()
  expect(seen).toContain(MARK)
})

test('anonymous REST never reveals draft content', async ({ request }) => {
  const paths = [
    '/api/globals/home-page?draft=true',
    '/api/globals/home-page',
    '/api/collage?draft=true',
    '/api/collage?draft=true&where[_status][equals]=draft',
    `/api/collage/${publishedCollageId}?draft=true`,
    `/api/collage/${draftCollageId}?draft=true`,
    `/api/collage/${draftCollageId}`,
    '/api/globals/home-page/versions',
    '/api/globals/home-page/versions?draft=true',
    '/api/collage/versions',
    '/api/collage/versions?draft=true',
    `/api/collage/versions?where[parent][equals]=${publishedCollageId}`,
    '/api/songs/versions',
    '/api/videos/versions',
    '/api/globals/about-page/versions',
  ]
  const leaks: string[] = []
  for (const p of paths) {
    const { status, text } = await anon(request, p)
    if (text.includes(MARK)) leaks.push(`${p} -> ${status} LEAKS draft`)
    if (/\/versions/.test(p) && status === 200 && /"totalDocs":\s*[1-9]/.test(text)) leaks.push(`${p} -> ${status} lists versions`)
  }
  const single = await anon(request, `/api/collage/${draftCollageId}`)
  expect.soft(single.status, 'unpublished piece by id').toBeGreaterThanOrEqual(400)
  expect(leaks).toEqual([])
})

test('public pages do not show drafts without preview mode', async ({ request }) => {
  for (const p of ['/', '/collage-art', '/art']) {
    const { text } = await anon(request, p)
    expect.soft(text.includes(MARK), p).toBe(false)
  }
  // The new draft piece is not counted: still 22.
  const collage = await anon(request, '/collage-art')
  expect((collage.text.match(/aria-haspopup="dialog"/g) || []).length).toBe(22)
})

test('preview route: 401 anonymous; signed-in user sees the draft; Exit returns to published', async ({ request, browser }) => {
  expect((await anon(request, '/next/preview?path=/')).status).toBe(401)
  // Signed-in preview shows the draft; the cookie also carries the admin session.
  const ctx = await browser.newContext()
  const token = admin.headers.Authorization.replace('JWT ', '')
  await ctx.addCookies([{ name: 'payload-token', value: token, url: BASE_URL }])
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/next/preview?path=/`)
  await expect(page.getByText(`${MARK} lead-in`)).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Preview mode' })).toBeVisible()
  await page.getByRole('link', { name: 'Exit' }).click()
  await expect(page.getByText(`${MARK} lead-in`)).toHaveCount(0)
  await ctx.close()
})

test('anonymous cannot create, update or delete anything', async ({ request }) => {
  const failures: string[] = []
  const expectDenied = (label: string, status: number) => {
    if (status < 400) failures.push(`${label} -> ${status}`)
  }
  for (const c of ['collage', 'songs', 'videos', 'media', 'users']) {
    expectDenied(`POST /api/${c}`, (await request.post(`${BASE_URL}/api/${c}`, { data: { alt: 'x', title: 'x', email: 'x@example.test', password: 'xxxxxxxxxxxx', name: 'x' } })).status())
    expectDenied(`PATCH /api/${c}/1`, (await request.patch(`${BASE_URL}/api/${c}/1`, { data: { alt: 'x', title: 'x', name: 'x' } })).status())
    expectDenied(`PATCH /api/${c} (bulk)`, (await request.patch(`${BASE_URL}/api/${c}?where[id][exists]=true`, { data: { alt: 'x', title: 'x' } })).status())
    expectDenied(`DELETE /api/${c}/1`, (await request.delete(`${BASE_URL}/api/${c}/1`)).status())
    expectDenied(`DELETE /api/${c} (bulk)`, (await request.delete(`${BASE_URL}/api/${c}?where[id][exists]=true`)).status())
  }
  for (const g of ['home-page', 'about-page', 'art-page', 'resources-page', 'contact-page', 'site-settings']) {
    expectDenied(`POST /api/globals/${g}`, (await request.post(`${BASE_URL}/api/globals/${g}`, { data: { leadIn: 'x', siteName: 'x' } })).status())
  }
  expectDenied('POST /api/users/first-register', (await request.post(`${BASE_URL}/api/users/first-register`, { data: { email: 'qa-first@example.test', password: 'Aa1!aaaaaaaaaaaa', name: 'x', role: 'admin' } })).status())
  // Anonymous read of users must be empty.
  const users = await request.get(`${BASE_URL}/api/users`)
  const usersBody = users.ok() ? await users.json() : { docs: [] }
  if (usersBody.docs?.length) failures.push(`GET /api/users -> ${usersBody.docs.length} users visible`)
  // GraphQL disabled.
  const gql = await request.post(`${BASE_URL}/api/graphql`, { data: { query: '{ Users { docs { email } } }' } })
  if (gql.ok() && (await gql.text()).includes('@')) failures.push('GraphQL exposes users')
  expect(failures).toEqual([])
})

test('editor role: cannot manage users or raise own role; can edit content', async ({ request }) => {
  const editor = await login(request, creds.editor)
  expect(editor.user.role).toBe('editor')
  const list = await (await request.get(`${BASE_URL}/api/users`, editor)).json()
  expect(list.docs.map((u: { id: number }) => u.id), 'editor lists only self').toEqual([editor.user.id])
  const created = await request.post(`${BASE_URL}/api/users`, {
    ...editor,
    data: { email: 'qa-editor-made@example.test', password: 'Aa1!qa-long-password', name: 'QA', role: 'admin' },
  })
  expect(created.status(), 'editor create user').toBeGreaterThanOrEqual(400)
  const del = await request.delete(`${BASE_URL}/api/users/${admin.user.id}`, editor)
  expect(del.status(), 'editor delete admin').toBeGreaterThanOrEqual(400)
  const patchAdmin = await request.patch(`${BASE_URL}/api/users/${admin.user.id}`, { ...editor, data: { name: 'pwned' } })
  expect(patchAdmin.status(), 'editor edits admin').toBeGreaterThanOrEqual(400)

  await request.patch(`${BASE_URL}/api/users/${editor.user.id}`, { ...editor, data: { role: 'admin' } })
  const me = await (await request.get(`${BASE_URL}/api/users/me`, editor)).json()
  expect(me.user.role, 'role after self-PATCH').toBe('editor')
  const relog = await login(request, creds.editor)
  expect(relog.user.role).toBe('editor')

  // Content: editor can save a draft of a page and of a collage piece (restored in afterAll).
  const g = await request.post(`${BASE_URL}/api/globals/home-page?draft=true`, { ...editor, data: { leadIn: `${MARK} by editor`, _status: 'draft' } })
  expect(g.ok()).toBeTruthy()
  const c = await request.patch(`${BASE_URL}/api/collage/${publishedCollageId}?draft=true`, { ...editor, data: { alt: `${MARK} by editor`, _status: 'draft' } })
  expect(c.ok()).toBeTruthy()
  // Site settings (no drafts): update + restore.
  const s = await (await request.get(`${BASE_URL}/api/globals/site-settings?depth=0`, editor)).json()
  const upd = await request.post(`${BASE_URL}/api/globals/site-settings`, { ...editor, data: { tagline: s.tagline } })
  expect(upd.ok()).toBeTruthy()
})

test('editor in the admin UI: no Team/Users in the nav, users list not reachable', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#field-email', creds.editor.email)
  await page.fill('#field-password', creds.editor.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin(\/)?$/)
  const nav = page.locator('nav')
  await expect(nav.getByRole('link', { name: /Team|Users/ })).toHaveCount(0)
  await page.goto(`${BASE_URL}/admin/collections/users`)
  await expect(page.locator('body')).not.toContainText(creds.admin.email)
})

test('login lockout after 5 failures (throwaway user)', async ({ request }) => {
  const email = `qa-lockout-${Date.now()}@example.test`
  const password = `Qa!${Date.now()}-correct-horse`
  const made = await request.post(`${BASE_URL}/api/users`, { ...admin, data: { email, password, name: 'QA lockout', role: 'editor' } })
  expect(made.ok(), await made.text()).toBeTruthy()
  const id = (await made.json()).doc.id
  try {
    const statuses: number[] = []
    for (let i = 0; i < 5; i++) {
      statuses.push((await request.post(`${BASE_URL}/api/users/login`, { data: { email, password: 'wrong-password' } })).status())
    }
    const locked = await request.post(`${BASE_URL}/api/users/login`, { data: { email, password } })
    expect(statuses.every((s) => s === 401)).toBeTruthy()
    expect(locked.status(), 'correct password after 5 failures').not.toBe(200)
    expect(await locked.text()).toMatch(/lock/i)
  } finally {
    await request.delete(`${BASE_URL}/api/users/${id}`, admin)
  }
})

