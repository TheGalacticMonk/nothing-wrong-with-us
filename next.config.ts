import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

import { mediaPublicURL } from './src/lib/mediaHost'

/** Where uploaded files may be served from in production: the R2 public hostname(s). */
const mediaHosts = [
  ...(mediaPublicURL ? [new URL(mediaPublicURL).hostname] : []),
  'media.nothingwrongwithyou.org',
]
const mediaOrigins = [...new Set(mediaHosts)].map((host) => `https://${host}`).join(' ')

/**
 * Ported from legacy/astro/public/_headers. Changes for this app:
 * - Live Preview shows the site in a frame inside /admin (same origin), so framing is allowed
 *   from the same origin only (was DENY / 'none').
 * - img-src allows YouTube thumbnails (video covers fall back to them). Fonts, images and
 *   scripts are otherwise self-hosted under /_next.
 * The CSP stays Report-Only until the console has been checked on the deployed site.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `img-src 'self' data: blob: https://i.ytimg.com ${mediaOrigins}`,
  `media-src 'self' ${mediaOrigins}`,
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  'frame-src https://www.youtube-nocookie.com',
  "connect-src 'self' https://formspree.io",
  "form-action 'self' https://formspree.io",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
]

const nextConfig: NextConfig = {
  // Don't let `next dev` write AGENTS.md/CLAUDE.md into the repo.
  agentRules: false,
  // Keep the dev-only Next.js badge out of visual comparisons with the Astro site.
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Next 16 only allows listed qualities. Per-image choices match the Astro build.
    qualities: [45, 60, 70, 75, 80],
    // Payload serves uploads at /api/<collection>/file/<filename> (media, collage).
    localPatterns: [{ pathname: '/api/**/file/**' }],
    // YouTube's own thumbnail when a video has no cover image.
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
      // Uploads served from the public R2 bucket in production (src/lib/mediaHost.ts).
      ...[...new Set(mediaHosts)].map((hostname) => ({ protocol: 'https' as const, hostname })),
    ],
  },
  async redirects() {
    // Old Squarespace URLs (legacy/astro/public/_redirects).
    return [
      { source: '/new-page', destination: '/resources', statusCode: 301 },
      { source: '/info-contact-carson', destination: '/contact', statusCode: 301 },
      { source: '/cart', destination: '/', statusCode: 301 },
    ]
  },
  async headers() {
    return [
      {
        // Every public route; the Payload admin and API keep their own headers.
        source: '/:path((?!admin(?:/|$)|api(?:/|$)).*)',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  experimental: {
    // Build workers share one local D1/R2 emulator; in parallel they crash it (SQLITE_READONLY).
    cpus: 1,
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
