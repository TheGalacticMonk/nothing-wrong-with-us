import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

import { BASE_URL, extractFacts, LEGACY_URL, ROUTES, type PageFacts } from './support/site'

/**
 * Functional parity with the legacy Astro site (LEGACY_URL). Compares what visitors and crawlers
 * see: title, meta/OG/Twitter, canonical, JSON-LD, heading outline, landmarks, links, image alts,
 * nav state and visible text. Diffs are written to test-results/qa/parity/<route>.json.
 */
const out = path.resolve('test-results/qa/parity')
fs.mkdirSync(out, { recursive: true })

// Payload's image URLs differ from Astro's by design; compare everything but the image src.
const comparable = (f: PageFacts) => ({
  ...f,
  images: f.images.map((i) => i.alt),
  // og:image/twitter:image URLs point at a different file path; compare presence only.
  meta: Object.fromEntries(
    Object.entries(f.meta).map(([k, v]) => [k, /:image$/.test(k) || k === 'twitter:image' ? Boolean(v) : v]),
  ),
  // Astro emits /_astro/* hrefs for nothing linkable; strip hashes of internal assets.
  // Songs moved from /audio/<file> to the Songs collection (the old URLs 301 there).
  links: f.links.map((l) => ({
    ...l,
    href: l.href.replace(/\.html$/, '').replace(/^\/audio\//, '/api/songs/file/'),
  })),
})

test.describe.configure({ mode: 'parallel' })

for (const width of [390, 1440]) {
  for (const route of ROUTES) {
    test(`parity ${route} @${width}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } })
      const legacyPage = await ctx.newPage()
      const appPage = await ctx.newPage()
      await legacyPage.goto(LEGACY_URL + route, { waitUntil: 'networkidle' })
      await appPage.goto(BASE_URL + route, { waitUntil: 'networkidle' })
      const legacy = comparable(await extractFacts(legacyPage))
      const app = comparable(await extractFacts(appPage))
      const name = `${route === '/' ? 'home' : route.slice(1)}-${width}`
      fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify({ legacy, app }, null, 2))

      expect.soft(app.title, 'title').toBe(legacy.title)
      expect.soft(app.canonical, 'canonical').toBe(legacy.canonical)
      expect.soft(app.meta, 'meta/OG/Twitter').toEqual(legacy.meta)
      expect.soft(app.jsonLd, 'JSON-LD').toEqual(legacy.jsonLd)
      expect.soft(app.headings, 'heading outline').toEqual(legacy.headings)
      expect.soft(app.landmarks, 'landmarks').toEqual(legacy.landmarks)
      expect.soft(app.links, 'links').toEqual(legacy.links)
      expect.soft(app.images, 'image alts').toEqual(legacy.images)
      expect.soft(app.current, 'nav active state').toEqual(legacy.current)
      expect.soft(app.text, 'visible text in <main>').toBe(legacy.text)
      await ctx.close()
    })
  }
}

test('404 page parity', async ({ page, request }) => {
  const res = await request.get(`${BASE_URL}/this-page-does-not-exist`)
  expect(res.status()).toBe(404)
  await page.goto(`${LEGACY_URL}/404`)
  const legacy = await extractFacts(page)
  await page.goto(`${BASE_URL}/this-page-does-not-exist`)
  const app = await extractFacts(page)
  expect.soft(app.title).toBe(legacy.title)
  expect.soft(app.meta.robots).toMatch(/noindex/)
  expect.soft(app.headings).toEqual(legacy.headings)
  expect.soft(app.text).toBe(legacy.text)
})

test('redirects are 301 to the right place', async ({ request }) => {
  for (const [from, to] of [
    ['/new-page', '/resources'],
    ['/info-contact-carson', '/contact'],
    ['/cart', '/'],
  ]) {
    const res = await request.get(BASE_URL + from, { maxRedirects: 0 })
    expect.soft(res.status(), from).toBe(301)
    expect.soft(new URL(res.headers().location, BASE_URL).pathname, from).toBe(to)
  }
})

test('sitemap.xml lists the 8 canonical URLs', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/sitemap.xml`)
  expect(res.status()).toBe(200)
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort()
  expect(locs).toEqual(
    ROUTES.map((r) => (r === '/' ? 'https://www.nothingwrongwithyou.org/' : `https://www.nothingwrongwithyou.org${r}`)).sort(),
  )
})

test('robots.txt allows the site, disallows admin, points at the sitemap', async ({ request }) => {
  const body = await (await request.get(`${BASE_URL}/robots.txt`)).text()
  expect(body).toMatch(/User-Agent: \*/i)
  expect(body).toMatch(/Disallow: \/admin/)
  expect(body).toContain('Sitemap: https://www.nothingwrongwithyou.org/sitemap.xml')
})

test('/blog stays 404', async ({ request }) => {
  expect((await request.get(`${BASE_URL}/blog`)).status()).toBe(404)
})
