import { expect, test } from '@playwright/test'

import { BASE_URL } from './support/site'

/** Stateless security checks: open redirects on the preview routes, response headers. */
test('preview/exit-preview reject open redirects', async ({ request }) => {
  const bad = ['//evil.example', 'https://evil.example', '/\\evil.example', 'evil.example', '/%5Cevil.example', '%2F%2Fevil.example', '/%09/evil.example', '/%0a/evil.example', '/%2F/evil.example']
  for (const p of bad) {
    for (const route of ['/next/preview', '/next/exit-preview']) {
      const res = await request.get(`${BASE_URL}${route}?path=${p}`, { maxRedirects: 0 })
      const loc = res.headers().location ?? ''
      const target = loc ? new URL(loc.replace(/[\t\n\r]/g, ''), BASE_URL) : null
      expect.soft(target?.host ?? new URL(BASE_URL).host, `${route}?path=${p} -> ${res.status()} ${loc}`).toBe(new URL(BASE_URL).host)
    }
  }
})

test('admin sends noindex; public pages send security headers', async ({ request }) => {
  const adminRes = await request.get(`${BASE_URL}/admin/login`)
  const html = await adminRes.text()
  expect(html).toMatch(/<meta name="robots" content="noindex, ?nofollow"/)
  for (const p of ['/', '/about-me', '/contact', '/this-does-not-exist']) {
    const h = (await request.get(BASE_URL + p)).headers()
    expect.soft(h['x-content-type-options'], p).toBe('nosniff')
    expect.soft(h['x-frame-options'], p).toBe('SAMEORIGIN')
    expect.soft(h['referrer-policy'], p).toBe('strict-origin-when-cross-origin')
    expect.soft(h['permissions-policy'], p).toContain('camera=()')
    expect.soft(h['content-security-policy-report-only'], p).toContain("default-src 'self'")
    expect.soft(h['x-powered-by'] ?? '', `${p} x-powered-by`).toBe('')
  }
})
