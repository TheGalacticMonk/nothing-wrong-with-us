import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

import { BASE_URL, freeze, LEGACY_URL, loadAllImages, ROUTES, VIEWPORTS } from './support/site'

/**
 * Visual regression against the legacy Astro site: full-page screenshots of both at 390×844 and
 * 1440×900, pixel diff with pixelmatch. Results: test-results/qa/visual/{route}-{vp}-{legacy,app,diff}.png
 * and summary.json. Threshold: VISUAL_MAX_DIFF (default 1%) of the larger image's pixels.
 */
const out = path.resolve('test-results/qa/visual')
fs.mkdirSync(out, { recursive: true })
const MAX = Number(process.env.VISUAL_MAX_DIFF ?? 0.01)

const shoot = async (page: Page, url: string) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url, { waitUntil: 'networkidle' })
  await freeze(page)
  await page.evaluate(() => document.fonts.ready)
  await loadAllImages(page)
  await page.waitForTimeout(300)
  return PNG.sync.read(await page.screenshot({ fullPage: true }))
}

/** Pads both images onto a same-size canvas (transparent-to-magenta) so height changes count. */
const pad = (img: PNG, w: number, h: number) => {
  const c = new PNG({ width: w, height: h })
  c.data.fill(0)
  for (let i = 0; i < c.data.length; i += 4) { c.data[i] = 255; c.data[i + 2] = 255; c.data[i + 3] = 255 }
  PNG.bitblt(img, c, 0, 0, img.width, img.height, 0, 0)
  return c
}

test.describe.configure({ mode: 'parallel' })

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  for (const route of ROUTES) {
    test(`visual ${route} ${vpName}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 })
      const page = await ctx.newPage()
      const legacy = await shoot(page, LEGACY_URL + route)
      const app = await shoot(page, BASE_URL + route)
      await ctx.close()

      const w = Math.max(legacy.width, app.width)
      const h = Math.max(legacy.height, app.height)
      const a = pad(legacy, w, h)
      const b = pad(app, w, h)
      const diff = new PNG({ width: w, height: h })
      const changed = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 })
      const ratio = changed / (w * h)

      const name = `${route === '/' ? 'home' : route.slice(1)}-${vpName}`
      fs.writeFileSync(path.join(out, `${name}-legacy.png`), PNG.sync.write(legacy))
      fs.writeFileSync(path.join(out, `${name}-app.png`), PNG.sync.write(app))
      fs.writeFileSync(path.join(out, `${name}-diff.png`), PNG.sync.write(diff))
      const summaryFile = path.join(out, 'summary.jsonl')
      fs.appendFileSync(
        summaryFile,
        JSON.stringify({ route, vpName, legacy: [legacy.width, legacy.height], app: [app.width, app.height], changed, ratio: +(ratio * 100).toFixed(3) }) + '\n',
      )
      expect.soft(app.height, 'page height').toBeGreaterThan(legacy.height * 0.97)
      expect(ratio, `${(ratio * 100).toFixed(2)}% pixels differ`).toBeLessThanOrEqual(MAX)
    })
  }
}
