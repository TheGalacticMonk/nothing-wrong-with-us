import type { LivePreviewConfig } from 'payload'

import { pagePaths, siteURL, type PageGlobalSlug } from './paths'

/** Preview URL for a page: goes through /next/preview so draft mode is switched on first. */
export const previewURL = (path: string, origin: string = siteURL) =>
  `${origin}/next/preview?path=${encodeURIComponent(path)}`

/** Phone, tablet and desktop sizes in the Live Preview toolbar. */
const breakpoints: NonNullable<LivePreviewConfig['breakpoints']> = [
  { label: 'Phone', name: 'phone', width: 390, height: 844 },
  { label: 'Tablet', name: 'tablet', width: 820, height: 1180 },
  { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
]

/**
 * `req.origin`, as provided to this config on Cloudflare Workers, has been observed to report the
 * scheme as `http` even though the admin request arrived over `https` (Cloudflare terminates TLS
 * at the edge; something in the Next.js/OpenNext request-reconstruction layer between the Worker
 * and Payload isn't preserving it). A browser silently refuses to load an `http://` iframe inside
 * an `https://` page ("mixed content"), which is what made Live Preview appear to hang with no
 * console error. `req.host` (hostname only, no scheme) has been reliable, so the scheme is derived
 * separately instead of trusted from `req.origin`: always https, except for local dev.
 */
const correctedOrigin = (req: { host?: string | null }): string | undefined => {
  if (!req.host) return undefined
  const isLocalDev = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.host)
  return `${isLocalDev ? 'http' : 'https'}://${req.host}`
}

/** Live Preview for a page opens beside the editor by default, like Ghost's split view. */
export const livePreviewFor = (path: string): LivePreviewConfig => ({
  openByDefault: true,
  breakpoints,
  // Same origin as the admin, so it works on localhost, preview deploys and production alike.
  url: ({ req }) => previewURL(path, correctedOrigin(req) || siteURL),
})

export const pageLivePreview = (slug: PageGlobalSlug) => livePreviewFor(pagePaths[slug])
