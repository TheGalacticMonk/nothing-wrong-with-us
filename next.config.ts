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
  // Don't advertise the stack (withPayload would add "X-Powered-By: Next.js, Payload").
  poweredByHeader: false,
  // Keep the dev-only Next.js badge out of visual comparisons with the Astro site.
  devIndicators: false,
  env: {
    // Read by the client-side image loader (src/lib/imageLoader.ts).
    NEXT_PUBLIC_MEDIA_URL: mediaPublicURL,
  },
  images: {
    // Production on the zone: resize at Cloudflare's edge instead of through the Worker.
    ...(process.env.NEXT_PUBLIC_IMAGE_TRANSFORMS === '1'
      ? { loader: 'custom' as const, loaderFile: './src/lib/imageLoader.ts' }
      : {}),
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
    // One public host: anything else (the workers.dev URL, and at launch the bare domain) is
    // redirected to CANONICAL_HOST, set at build time on deploys. Unset locally.
    const canonicalHost = process.env.CANONICAL_HOST
    const hostRedirect = canonicalHost
      ? [
          {
            source: '/:path*',
            missing: [{ type: 'host' as const, value: canonicalHost }],
            destination: `https://${canonicalHost}/:path*`,
            permanent: true,
          },
        ]
      : []
    // Old Squarespace URLs (legacy/astro/public/_redirects).
    return [
      ...hostRedirect,
      { source: '/new-page', destination: '/resources', statusCode: 301 },
      { source: '/info-contact-carson', destination: '/contact', statusCode: 301 },
      { source: '/cart', destination: '/', statusCode: 301 },
      // The Astro site served songs from /audio/<file>.mp3; they now live in the Songs collection.
      { source: '/audio/:file', destination: '/api/songs/file/:file', statusCode: 301 },
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
        // The admin and API may only be framed by this site (Live Preview frames the public
        // pages, never the admin), so another site can't trick an editor into clicking Publish.
        source: '/:area(admin|api)/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/:area(admin|api)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
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
    // Inline CSS into the HTML like the Astro site did (inlineStylesheets: 'always'): no
    // render-blocking stylesheet requests before first paint.
    inlineCss: true,
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
