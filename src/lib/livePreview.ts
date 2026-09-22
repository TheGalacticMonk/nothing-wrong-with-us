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

/** Live Preview for a page opens beside the editor by default, like Ghost's split view. */
export const livePreviewFor = (path: string): LivePreviewConfig => ({
  openByDefault: true,
  breakpoints,
  // Same origin as the admin, so it works on localhost, preview deploys and production alike.
  url: ({ req }) => previewURL(path, req.origin || siteURL),
})

export const pageLivePreview = (slug: PageGlobalSlug) => livePreviewFor(pagePaths[slug])
