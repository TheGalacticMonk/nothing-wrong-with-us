import fs from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { BASE_URL, ROUTES, VIEWPORTS } from './support/site'

/**
 * axe-core (WCAG 2.0/2.1/2.2 A+AA + best practices) on every public route at 390 and 1440 px,
 * plus the 404 page and the open states (mobile menu, Social dropdown, collage viewer).
 * Zero serious/critical violations required. Full results: test-results/qa/axe/.
 */
const out = path.resolve('test-results/qa/axe')
fs.mkdirSync(out, { recursive: true })
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

const blocking = (violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) =>
  violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)

test.describe.configure({ mode: 'parallel' })

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const route of [...ROUTES, '/this-does-not-exist']) {
    test(`axe ${route} ${vpName}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const page = await ctx.newPage()
      await page.goto(BASE_URL + route, { waitUntil: 'networkidle' })
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      const name = `${route === '/' ? 'home' : route.slice(1)}-${vpName}`
      fs.writeFileSync(
        path.join(out, `${name}.json`),
        JSON.stringify(results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target) })), null, 2),
      )
      await ctx.close()
      expect(blocking(results.violations)).toEqual([])
    })
  }
}

test('axe: open states (mobile menu, Social dropdown, collage viewer)', async ({ browser }) => {
  const mobile = await browser.newContext({ viewport: VIEWPORTS.mobile, reducedMotion: 'reduce' })
  const m = await mobile.newPage()
  await m.goto(`${BASE_URL}/`)
  await m.locator('summary', { hasText: 'Menu' }).click()
  await m.locator('summary', { hasText: 'Social' }).last().click()
  await m.waitForTimeout(800) // let the menu's fade-in finish before measuring contrast
  const menu = blocking((await new AxeBuilder({ page: m }).withTags(TAGS).analyze()).violations)
  await mobile.close()

  const desktop = await browser.newContext({ viewport: VIEWPORTS.desktop, reducedMotion: 'reduce' })
  const d = await desktop.newPage()
  await d.goto(`${BASE_URL}/`)
  await d.locator('nav[aria-label="Main"] summary', { hasText: 'Social' }).first().click()
  const social = blocking((await new AxeBuilder({ page: d }).withTags(TAGS).analyze()).violations)
  await d.goto(`${BASE_URL}/collage-art`)
  await d.locator('button[aria-haspopup="dialog"]').first().click()
  const viewer = blocking((await new AxeBuilder({ page: d }).include('dialog').withTags(TAGS).analyze()).violations)
  await desktop.close()
  expect({ menu, social, viewer }).toEqual({ menu: [], social: [], viewer: [] })
})

test('keyboard walkthrough: every focus stop is visible and has a focus indicator', async ({ browser }) => {
  const problems: string[] = []
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(BASE_URL + route)
    const seen = new Set<string>()
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        const indicator =
          (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) ||
          cs.boxShadow !== 'none' ||
          cs.textDecorationLine.includes('underline')
        return {
          key: `${el.tagName}:${el.getAttribute('href') ?? ''}:${(el.textContent || '').trim().slice(0, 30)}:${Math.round(r.top + scrollY)}`,
          label: `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`,
          visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden',
          indicator,
        }
      })
      if (!info || seen.has(info.key)) break
      seen.add(info.key)
      if (!info.visible) problems.push(`${route}: invisible focus stop ${info.label}`)
      else if (!info.indicator) problems.push(`${route}: no focus indicator on ${info.label}`)
    }
    await ctx.close()
  }
  fs.writeFileSync(path.join(out, 'keyboard.json'), JSON.stringify(problems, null, 2))
  expect(problems).toEqual([])
})
