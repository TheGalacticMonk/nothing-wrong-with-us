import type { Metadata } from 'next'

import type { Media, SiteSetting } from '@/payload-types'

/**
 * Canonical origin for every canonical/OG URL, the sitemap and JSON-LD. Hard-coded on purpose:
 * preview deploys (workers.dev) must canonicalise to production, not to themselves.
 */
export const CANONICAL_ORIGIN = 'https://www.nothingwrongwithyou.org'

/** Used only when Site Settings has never been saved. */
export const FALLBACK_SITE_NAME = 'Nothing Wrong With You'

const DEFAULT_IMAGE = '/og-default.jpg'
const DEFAULT_IMAGE_ALT =
  'Illustration of a woman’s face, half living and half skull, under a painted night sky of stars.'

/** Preview deploys set NEXT_PUBLIC_NOINDEX=1 so they never get indexed. */
export const noindexEverywhere = () => process.env.NEXT_PUBLIC_NOINDEX === '1'

type SeoGroup =
  | {
      title?: string | null
      description?: string | null
      shareImage?: number | Media | null
    }
  | null
  | undefined

const asMedia = (value: number | Media | null | undefined): Media | null =>
  value && typeof value === 'object' && value.url ? value : null

export const absoluteURL = (pathOrURL: string) => new URL(pathOrURL, CANONICAL_ORIGIN).href

export const siteName = (settings: SiteSetting | null | undefined) =>
  settings?.siteName || FALLBACK_SITE_NAME

interface PageMetadataArgs {
  /** Public path, e.g. `/about-me`. */
  path: string
  seo?: SeoGroup
  settings?: SiteSetting | null
  /** Used when the page has no SEO title (e.g. the 404). */
  title?: string
  description?: string
  isHome?: boolean
  noindex?: boolean
}

/** Reproduces legacy/astro/src/components/SEO.astro. */
export const pageMetadata = ({
  path,
  seo,
  settings,
  title,
  description,
  isHome = false,
  noindex = false,
}: PageMetadataArgs): Metadata => {
  const name = siteName(settings)
  const pageTitle = seo?.title || title || name
  const fullTitle = isHome
    ? settings?.tagline
      ? `${name}: ${settings.tagline}`
      : name
    : `${pageTitle} — ${name}`
  const desc = seo?.description || description || settings?.defaultDescription || undefined
  const canonical = absoluteURL(path)

  const media = asMedia(seo?.shareImage) ?? asMedia(settings?.shareImage)
  const image = media
    ? {
        url: absoluteURL(media.url as string),
        width: media.width || 1200,
        height: media.height || 630,
        alt: media.alt || DEFAULT_IMAGE_ALT,
      }
    : { url: absoluteURL(DEFAULT_IMAGE), width: 1200, height: 630, alt: DEFAULT_IMAGE_ALT }

  return {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical },
    robots: noindex || noindexEverywhere() ? { index: false } : undefined,
    openGraph: {
      siteName: name,
      locale: 'en_US',
      type: 'website',
      title: fullTitle,
      description: desc,
      url: canonical,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      images: [{ url: image.url, alt: image.alt }],
    },
  }
}

/** WebSite + Person structured data for the home page (same facts as the Astro site). */
export const homeJsonLd = (settings: SiteSetting | null | undefined) => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName(settings),
    url: CANONICAL_ORIGIN,
    description: settings?.defaultDescription || undefined,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings?.ownerName || 'Becca Berry',
    honorificSuffix: 'Esq.',
    url: `${CANONICAL_ORIGIN}/about-me`,
    sameAs: (settings?.social ?? []).map((link) => link.url).filter(Boolean),
  },
]
