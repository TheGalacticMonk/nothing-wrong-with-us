import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'

import { adminFavicon } from './admin/favicon'
import { adminTranslations } from './admin/translations'
import { Collage } from './collections/Collage'
import { Media } from './collections/Media'
import { Songs } from './collections/Songs'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { writingEditor } from './fields/richText'
import { AboutPage } from './globals/AboutPage'
import { ArtPage } from './globals/ArtPage'
import { ContactPage } from './globals/ContactPage'
import { HomePage } from './globals/HomePage'
import { ResourcesPage } from './globals/ResourcesPage'
import { SiteSettings } from './globals/SiteSettings'
import { mediaPublicURL } from './lib/mediaHost'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => {
  try {
    return fs.existsSync(value) ? fs.realpathSync(value) : undefined
  } catch {
    return undefined
  }
}

const isCLI = process.argv.some((value) => {
  const resolved = realpath(value)
  if (!resolved) return false
  return (
    resolved.endsWith(path.join('payload', 'bin.js')) ||
    resolved.endsWith(path.join('next', 'dist', 'bin', 'next'))
  )
})
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

// Link uploads from the public R2 hostname when configured (see src/lib/mediaHost.ts).
const publicFiles = mediaPublicURL
  ? {
      generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
        `${mediaPublicURL}/${prefix ? `${prefix}/` : ''}${encodeURIComponent(filename)}`,
    }
  : true

// `next build` workers don't look like the CLI but must not reach Cloudflare either.
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

const cloudflare =
  isCLI || isBuild || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Nothing Wrong With You',
      robots: 'noindex, nofollow',
      // The site's star, so the browser tab isn't Payload's logo.
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: adminFavicon }],
    },
    // Light only, like Ghost: calm for long form-filling, and the one palette checked for contrast.
    theme: 'light',
    // Plain avatar: no Gravatar request, no surprise stranger's face.
    avatar: 'default',
    components: {
      graphics: {
        Logo: '/admin/Logo',
        Icon: '/admin/Icon',
      },
      // Loads the site's display font for the wordmark and headings.
      providers: ['/admin/BrandFonts'],
      afterNavLinks: ['/admin/ViewSiteLink'],
      views: {
        // Task cards for everyone; Payload's full section grid is added for admins only.
        dashboard: { Component: '/admin/Dashboard' },
      },
    },
  },
  i18n: {
    // Plainer button and message wording (see src/admin/translations.ts).
    translations: adminTranslations,
  },
  // Order here is the order in the admin menu (within each group).
  collections: [Collage, Songs, Videos, Media, Users],
  globals: [HomePage, AboutPage, ArtPage, ResourcesPage, ContactPage, SiteSettings],
  editor: writingEditor,
  graphQL: { disable: true },
  upload: {
    // Workers accept request bodies up to 100 MB; keep uploads well under that.
    limits: { fileSize: 40 * 1024 * 1024 },
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    // Committed migrations own the schema (src/migrations). Dev-mode push conflicts with them.
    push: false,
  }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: publicFiles, collage: publicFiles, songs: publicFiles },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        // The "remote" wrangler environment is the only place real D1/R2 bindings are declared.
        environment: process.env.PAYLOAD_REMOTE_BINDINGS === '1' ? 'remote' : process.env.CLOUDFLARE_ENV,
        // Only touch the real Cloudflare D1/R2 when explicitly asked (`deploy:database`, remote
        // seeding). Builds, dev and scripts otherwise use wrangler's local emulation.
        remoteBindings: process.env.PAYLOAD_REMOTE_BINDINGS === '1',
      } satisfies GetPlatformProxyOptions),
  )
}
