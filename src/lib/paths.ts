/**
 * Single source of truth for which public URL each page global renders.
 * Used by Live Preview, revalidation, the sitemap and the admin "View page" links.
 */
export const pagePaths = {
  'home-page': '/',
  'about-page': '/about-me',
  'art-page': '/art',
  'resources-page': '/resources',
  'contact-page': '/contact',
} as const

export type PageGlobalSlug = keyof typeof pagePaths

/** Which public pages show items from each collection (counts, galleries, home tiles). */
export const collectionPaths = {
  collage: ['/collage-art', '/art', '/'],
  songs: ['/music', '/art', '/'],
  videos: ['/videos', '/art', '/'],
} as const

export const siteURL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)
