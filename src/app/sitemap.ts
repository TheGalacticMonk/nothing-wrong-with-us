import type { MetadataRoute } from 'next'

import { CANONICAL_ORIGIN } from '@/lib/seo'

/** The same 8 public URLs as the Astro sitemap, always on the production origin. */
const paths = ['/', '/about-me', '/art', '/collage-art', '/contact', '/music', '/resources', '/videos']

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: path === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${path}` }))
}
