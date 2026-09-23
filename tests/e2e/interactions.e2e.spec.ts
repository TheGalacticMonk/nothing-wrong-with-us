import { expect, test } from '@playwright/test'

import net from 'node:net'
import tls from 'node:tls'

import { BASE_URL, VIEWPORTS } from './support/site'

/** HTTP/1.1 GET over a raw socket with Connection: close; returns status, headers and body length. */
const rawGet = (url: string, headers: Record<string, string>) =>
  new Promise<{ status: number; headers: Record<string, string>; bodyLength: number }>((resolve, reject) => {
    const u = new URL(url)
    const secure = u.protocol === 'https:'
    const socket = secure
      ? tls.connect({ port: Number(u.port || 443), host: u.hostname, servername: u.hostname, ALPNProtocols: ['http/1.1'] })
      : net.connect(Number(u.port || 80), u.hostname)
    const chunks: Buffer[] = []
    socket.on(secure ? 'secureConnect' : 'connect', () => {
      const extra = Object.entries(headers).map(([k, v]) => `${k}: ${v}\r\n`).join('')
      socket.write(`GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\n${extra}Connection: close\r\n\r\n`)
    })
    socket.on('data', (c) => chunks.push(c))
    socket.on('error', reject)
    socket.setTimeout(30_000, () => socket.destroy(new Error('timeout')))
    socket.on('end', () => {
      const buf = Buffer.concat(chunks)
      const split = buf.indexOf('\r\n\r\n')
      const head = buf.subarray(0, split).toString().split('\r\n')
      const parsed: Record<string, string> = {}
      for (const line of head.slice(1)) {
        const i = line.indexOf(':')
        parsed[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim()
      }
      let body = buf.subarray(split + 4)
      if (parsed['transfer-encoding'] === 'chunked') {
        const parts: Buffer[] = []
        let rest = body
        for (;;) {
          const eol = rest.indexOf('\r\n')
          const size = parseInt(rest.subarray(0, eol).toString(), 16)
          if (!size) break
          parts.push(rest.subarray(eol + 2, eol + 2 + size))
          rest = rest.subarray(eol + 2 + size + 2)
        }
        body = Buffer.concat(parts)
      }
      resolve({ status: Number(head[0].split(' ')[1]), headers: parsed, bodyLength: body.length })
    })
  })

test.describe('mobile menu (390px)', () => {
  test.use({ viewport: VIEWPORTS.mobile })

  test('opens, shows nav with current page, closes on Escape (focus back) and click-away', async ({ page }) => {
    await page.goto(`${BASE_URL}/about-me`)
    const summary = page.locator('summary', { hasText: 'Menu' })
    const menu = page.locator('details:has(summary:has-text("Menu"))')
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(menu).toHaveAttribute('open', '')
    const menuNav = menu.getByRole('navigation', { name: 'Main' })
    await expect(menuNav.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page')
    await page.keyboard.press('Escape')
    await expect(menu).not.toHaveAttribute('open', '')
    await expect(summary).toBeFocused()

    await summary.click()
    await expect(menu).toHaveAttribute('open', '')
    await page.mouse.click(200, 700)
    await expect(menu).not.toHaveAttribute('open', '')
  })

  test('nested Social list opens and collapses when the menu closes', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.locator('summary', { hasText: 'Menu' }).click()
    const menu = page.locator('details:has(summary:has-text("Menu"))')
    const social = menu.locator('details:has(summary:has-text("Social"))')
    await social.locator('summary').click()
    await expect(social.getByRole('link', { name: 'Facebook' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.locator('summary', { hasText: 'Menu' }).click()
    await expect(social).not.toHaveAttribute('open', '')
  })

  test('menu is keyboard operable', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    const summary = page.locator('summary', { hasText: 'Menu' })
    await summary.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveText('Home')
  })
})

test.describe('desktop Social dropdown (1440px)', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('keyboard: Enter opens, links are reachable, Escape closes with focus back', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    const dropdown = page.locator('nav[aria-label="Main"] details').first()
    const summary = dropdown.locator('summary')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(dropdown).toHaveAttribute('open', '')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveText('Instagram (personal)')
    const first = dropdown.getByRole('link').first()
    await expect(first).toHaveAttribute('target', '_blank')
    await expect(first).toHaveAttribute('rel', /noopener/)
    await page.keyboard.press('Escape')
    await expect(dropdown).not.toHaveAttribute('open', '')
    await expect(summary).toBeFocused()
  })

  test('click-away closes', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    const dropdown = page.locator('nav[aria-label="Main"] details').first()
    await dropdown.locator('summary').click()
    await expect(dropdown).toHaveAttribute('open', '')
    await page.mouse.click(700, 600)
    await expect(dropdown).not.toHaveAttribute('open', '')
  })
})

test.describe('collage lightbox', () => {
  test('keyboard open, arrows, wrap-around, Escape, focus returns to the thumbnail', async ({ page }) => {
    await page.goto(`${BASE_URL}/collage-art`)
    const thumbs = page.locator('ul li button[aria-haspopup="dialog"]')
    await expect(thumbs).toHaveCount(22)
    const second = thumbs.nth(1)
    await second.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Collage viewer' })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('#viewer-count')).toHaveText('2 of 22')
    const alt2 = await second.locator('img').getAttribute('alt')
    await expect(dialog.locator('#viewer-img')).toHaveAttribute('alt', alt2!)
    await page.keyboard.press('ArrowRight')
    await expect(dialog.locator('#viewer-count')).toHaveText('3 of 22')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(dialog.locator('#viewer-count')).toHaveText('22 of 22')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(second).toBeFocused()
  })

  test('buttons and backdrop click close; focus stays in dialog while open', async ({ page }) => {
    await page.goto(`${BASE_URL}/collage-art`)
    const thumb = page.locator('ul li button[aria-haspopup="dialog"]').first()
    await thumb.click()
    const dialog = page.getByRole('dialog', { name: 'Collage viewer' })
    await dialog.getByRole('button', { name: /Next/ }).click()
    await expect(dialog.locator('#viewer-count')).toHaveText('2 of 22')
    // Note: Tab past the last button leaves the page for the browser UI (native modal <dialog>),
    // same as the legacy site, so focus containment is not asserted beyond the first stop.
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true)
    await dialog.getByRole('button', { name: /Close/ }).click()
    await expect(dialog).toBeHidden()
    await expect(thumb).toBeFocused()
    await thumb.click()
    await page.mouse.click(5, 5)
    await expect(dialog).toBeHidden()
  })
})

test('YouTube facade: no request to YouTube before click; nocookie iframe after', async ({ page }) => {
  const youtube: string[] = []
  page.on('request', (r) => {
    if (/youtube|ytimg|googlevideo|doubleclick/.test(new URL(r.url()).hostname)) youtube.push(r.url())
  })
  await page.goto(`${BASE_URL}/videos`, { waitUntil: 'networkidle' })
  await page.mouse.wheel(0, 3000)
  await page.waitForTimeout(800)
  expect(youtube, 'requests to YouTube before any click').toEqual([])
  const play = page.getByRole('link', { name: /^Play “.+” video$/ })
  await expect(play).toHaveCount(3)
  await expect(play.first()).toHaveAttribute('href', /youtube\.com\/watch\?v=/)
  await play.first().click()
  const frame = page.locator('iframe[src*="youtube-nocookie.com/embed/"]')
  await expect(frame).toHaveCount(1)
  await expect(frame).toBeFocused()
})

test.describe('audio', () => {
  test('each song supports Range requests (206) and seeking', async ({ page, request }) => {
    await page.goto(`${BASE_URL}/music`)
    const audios = page.locator('audio')
    await expect(audios).toHaveCount(3)
    const srcs = await audios.evaluateAll((els) => els.map((e) => (e as HTMLAudioElement).currentSrc || (e as HTMLAudioElement).src))
    for (const src of srcs) {
      const full = await request.head(src)
      expect.soft(full.status(), `HEAD ${src}`).toBe(200)
      expect.soft(full.headers()['content-type'], src).toMatch(/audio\/mpeg/)
      // Raw socket: counts the bytes actually sent, which an HTTP client would reject if over-long.
      const ranged = await rawGet(src, { Range: 'bytes=1000-1999' })
      expect.soft(ranged.status, `Range ${src}`).toBe(206)
      expect.soft(ranged.headers['content-range'], src).toMatch(/^bytes 1000-1999\/\d+$/)
      expect.soft(ranged.headers['content-length'], src).toBe('1000')
      expect.soft(ranged.bodyLength, `bytes actually sent for ${src}`).toBe(1000)
      expect.soft(ranged.headers['accept-ranges'], src).toBe('bytes')
    }
  })

  test('first song plays and seeks in the browser', async ({ page }) => {
    await page.goto(`${BASE_URL}/music`)
    const audios = page.locator('audio')
    const result = await audios.first().evaluate(async (el: HTMLAudioElement) => {
      el.muted = true
      await el.play()
      await new Promise((r) => setTimeout(r, 1200))
      const t1 = el.currentTime
      el.currentTime = 120
      await new Promise((r) => el.addEventListener('seeked', r, { once: true }))
      await new Promise((r) => setTimeout(r, 800))
      const t2 = el.currentTime
      el.pause()
      return { t1, t2, duration: el.duration, error: el.error?.code ?? null }
    })
    expect(result.error).toBeNull()
    expect(result.t1).toBeGreaterThan(0)
    expect(result.t2).toBeGreaterThanOrEqual(120)
    expect(result.duration).toBeGreaterThan(120)
  })
})

test('contact form without a Formspree ID: shown, cannot be sent', async ({ page }) => {
  // Only meaningful before a Formspree ID is configured (e.g. a fresh/local seed). On a preview
  // or production deploy where the client has already connected the form, this is expected to
  // be false — see the "with a Formspree ID configured" test below for that case instead.
  test.skip(process.env.EXPECT_FORMSPREE_CONFIGURED === '1', 'Formspree ID already set for this env')
  await page.goto(`${BASE_URL}/contact`)
  const form = page.locator('form[aria-labelledby="form-title"]')
  await expect(form).toBeVisible()
  await expect(form).not.toHaveAttribute('action', /formspree/)
  await expect(form.getByRole('button', { name: 'Send message' })).toBeDisabled()
  for (const label of ['Your name', 'Your email', 'What is this about?', 'Message']) {
    await expect(form.getByLabel(label)).toBeVisible()
  }
})

test('contact form with a Formspree ID configured: enabled and posts to Formspree', async ({ page }) => {
  test.skip(process.env.EXPECT_FORMSPREE_CONFIGURED !== '1', 'no Formspree ID confirmed for this env')
  await page.goto(`${BASE_URL}/contact`)
  const form = page.locator('form[aria-labelledby="form-title"]')
  await expect(form).toBeVisible()
  await expect(form).toHaveAttribute('action', /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/)
  await expect(form.getByRole('button', { name: 'Send message' })).toBeEnabled()
})

test('reduced motion: no shooting stars, no reveal animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/`)
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  expect(running).toBe(0)
  await ctx.close()
  const ctx2 = await browser.newContext({ reducedMotion: 'no-preference' })
  const page2 = await ctx2.newPage()
  await page2.goto(`${BASE_URL}/`)
  expect(await page2.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0)
  await ctx2.close()
})

test('skip link is first focusable, visible on focus, and moves focus to main', async ({ page }) => {
  await page.goto(`${BASE_URL}/about-me`)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  const box = await skip.boundingBox()
  expect(box && box.width > 1 && box.height > 1 && box.y >= 0).toBeTruthy()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
})
