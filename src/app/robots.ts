import type { MetadataRoute } from 'next'

import { CANONICAL_ORIGIN } from '@/lib/seo'

/** Preview deploys stay crawlable so crawlers can see their `noindex` (NEXT_PUBLIC_NOINDEX=1). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
  }
}
