import type { Page } from '@playwright/test'

/** App under test. Point at env A (next dev, :3000) or env B (wrangler dev, :8787). */
export const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
/** The legacy Astro build (`cd legacy/astro && npx astro preview --port 4321`). */
export const LEGACY_URL = (process.env.LEGACY_URL || 'http://localhost:4321').replace(/\/$/, '')
export const CANONICAL = 'https://www.nothingwrongwithyou.org'

export const ROUTES = ['/', '/about-me', '/art', '/collage-art', '/music', '/videos', '/resources', '/contact'] as const

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
} as const

export interface PageFacts {
  title: string
  meta: Record<string, string>
  canonical: string | null
  jsonLd: unknown[]
  headings: string[]
  landmarks: string[]
  links: { text: string; href: string; target: string | null; rel: string | null }[]
  images: { alt: string | null; src: string }[]
  current: string[]
  text: string
}

/** Everything the parity test compares, read from the rendered DOM. */
export const extractFacts = (page: Page): Promise<PageFacts> =>
  page.evaluate(() => {
    const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
    const meta: Record<string, string> = {}
    document.querySelectorAll('meta[name], meta[property]').forEach((m) => {
      const key = m.getAttribute('property') || m.getAttribute('name')!
      if (/^(og:|twitter:|description$|robots$)/.test(key)) {
        meta[key] = meta[key] ? `${meta[key]} | ${m.getAttribute('content')}` : m.getAttribute('content') || ''
      }
    })
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
      const v = JSON.parse(s.textContent || 'null')
      return Array.isArray(v) ? v : v?.['@graph'] ?? [v]
    })
    const visible = (el: Element) => {
      const st = getComputedStyle(el)
      return st.display !== 'none' && st.visibility !== 'hidden'
    }
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(
      (h) => `${h.tagName.toLowerCase()}: ${norm((h as HTMLElement).innerText || h.textContent)}`,
    )
    const landmarks = [...document.querySelectorAll('header,nav,main,footer,aside,[role=banner],[role=contentinfo],[role=navigation],[role=main],form[aria-label],form[aria-labelledby],section[aria-label],section[aria-labelledby]')]
      .filter((el) => !el.closest('dialog'))
      .map((el) => `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''}`)
    const links = [...document.querySelectorAll('a[href]')].map((a) => ({
      text: norm(a.textContent) || norm(a.getAttribute('aria-label')),
      href: a.getAttribute('href')!.replace(/^https?:\/\/localhost:\d+/, ''),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    }))
    const images = [...document.querySelectorAll('img')].filter((i) => !i.closest('dialog')).map((i) => ({ alt: i.getAttribute('alt'), src: i.currentSrc || i.src }))
    const current = [...document.querySelectorAll('[aria-current]')].filter(visible).map((a) => `${norm(a.textContent)}=${a.getAttribute('aria-current')}`)
    const main = document.querySelector('main')
    return {
      title: document.title,
      meta,
      canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null,
      jsonLd,
      headings,
      landmarks,
      links,
      images,
      current,
      text: norm(main ? (main as HTMLElement).innerText : document.body.innerText),
    }
  })

/** Freeze animations so screenshots are deterministic. */
export const freeze = async (page: Page) => {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`,
  })
}

/** Scroll through the page so lazy images load, then return to the top. */
export const loadAllImages = async (page: Page) => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r }))),
    )
  })
}
