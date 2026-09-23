/**
 * Seeds the CMS with the content of the live Astro site (legacy/astro). Idempotent.
 *
 *   pnpm seed                 # local wrangler D1/R2 (.wrangler/state)
 *   pnpm seed --force         # also overwrite globals and item fields that were already seeded
 *   pnpm seed --dry-run       # report what would happen, write nothing
 *
 * Remote (production) runs are refused unless `--allow-remote` is passed AND
 * `SEED_CONFIRM=I_UNDERSTAND` is set. See docs/migration/03-content-migration.md.
 *
 * Rerun rules:
 *   - Collection items are matched by a stable key (collage/media: filename, songs: title,
 *     videos: YouTube link). Existing items are left alone (files are never re-uploaded);
 *     with --force their text fields are reset to the legacy values.
 *   - A global is written only if it has never been saved, unless --force.
 *   - Users are only created while the users table is empty.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

import { guardTarget, hasFlag } from './lib/guard'
import * as src from './lib/legacy'
import { markdownToLexical } from './lib/richtext'

guardTarget('seed', { writes: true })
// Migrations own the schema (see docs/migration/02-architecture.md). Payload's dev-mode
// schema push is skipped; run `pnpm payload migrate` first.
process.env.PAYLOAD_MIGRATING = 'true'

const force = hasFlag('--force')
const dryRun = hasFlag('--dry-run')

const { default: configPromise } = await import('@payload-config')
const { getPayload } = await import('payload')
const config = await configPromise
const payload = await getPayload({ config })

type UploadSlug = 'media' | 'collage' | 'songs'
type CollectionSlug = UploadSlug | 'videos' | 'users'
type GlobalSlug = 'home-page' | 'about-page' | 'art-page' | 'resources-page' | 'contact-page' | 'site-settings'

const context = { skipRevalidate: true }
const tally = { created: 0, updated: 0, unchanged: 0, skipped: 0 }
const log = (symbol: string, msg: string) => console.log(`  ${symbol} ${msg}`)

const counts = async () => {
  const slugs: CollectionSlug[] = ['collage', 'songs', 'videos', 'media', 'users']
  const out: Record<string, number> = {}
  for (const collection of slugs) out[collection] = (await payload.count({ collection, overrideAccess: true })).totalDocs
  return out
}

// ---------------------------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------------------------

const findOne = async (collection: CollectionSlug, field: string, value: string) => {
  const res = await payload.find({
    collection,
    where: { [field]: { equals: value } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
    draft: true,
    context,
  })
  if (res.totalDocs > 1) throw new Error(`${collection}: more than one document has ${field} = "${value}". Fix duplicates first.`)
  return res.docs[0] as unknown as { id: number | string; [k: string]: unknown } | undefined
}

/**
 * Creates the document (uploading `filePath` if given) unless one with the same key exists.
 * Returns the document id.
 */
const upsert = async (opts: {
  collection: CollectionSlug
  key: { field: string; value: string }
  data: Record<string, unknown>
  filePath?: string
  label: string
}) => {
  const { collection, key, data, filePath, label } = opts
  const existing = await findOne(collection, key.field, key.value)
  if (existing) {
    const differs = Object.entries(data).some(([k, v]) => k !== '_status' && JSON.stringify(existing[k] ?? null) !== JSON.stringify(v ?? null))
    if (force && differs) {
      if (!dryRun)
        await payload.update({ collection, id: existing.id, data, overrideAccess: true, context, depth: 0 })
      tally.updated++
      log('~', `${collection}: ${label} (fields reset, file kept)`)
    } else {
      tally.unchanged++
      log('=', `${collection}: ${label} (exists${differs ? ', edited since seeding; kept' : ''})`)
    }
    return existing.id
  }
  if (filePath && !fs.existsSync(filePath)) throw new Error(`Missing source file: ${filePath}`)
  tally.created++
  log('+', `${collection}: ${label}`)
  if (dryRun) return -1
  const doc = await payload.create({
    collection,
    data: data as never,
    ...(filePath ? { filePath } : {}),
    overrideAccess: true,
    draft: false,
    context,
    depth: 0,
  })
  return doc.id
}

/** Workers can't resize on upload, so very large images are converted to WebP here first. */
const prepareHero = async () => {
  const size = fs.statSync(src.hero.sourcePath).size
  if (size <= 3 * 1024 * 1024) return { filePath: src.hero.sourcePath, filename: path.basename(src.hero.sourcePath) }
  const outDir = path.join(os.tmpdir(), 'nwwy-seed')
  const out = path.join(outDir, src.hero.filename)
  if (!fs.existsSync(out)) {
    fs.mkdirSync(outDir, { recursive: true })
    const require = createRequire(import.meta.url)
    type Sharp = (input: string) => {
      resize: (o: object) => { webp: (o: object) => { toFile: (f: string) => Promise<unknown> } }
    }
    let sharp: Sharp
    try {
      sharp = require(path.join(src.legacyRoot, 'node_modules', 'sharp'))
    } catch {
      sharp = require('sharp')
    }
    await sharp(src.hero.sourcePath)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(out)
    log('·', `hero: converted ${(size / 1e6).toFixed(1)} MB PNG -> ${(fs.statSync(out).size / 1e6).toFixed(1)} MB WebP (${out})`)
  }
  return { filePath: out, filename: src.hero.filename }
}

const seedUploads = async () => {
  console.log('\nImages (media)')
  const portraitId = await upsert({
    collection: 'media',
    key: { field: 'filename', value: src.portrait.filename },
    data: { alt: src.portrait.alt },
    filePath: src.portrait.filePath,
    label: src.portrait.filename,
  })
  const heroFile = await prepareHero()
  const heroId = await upsert({
    collection: 'media',
    key: { field: 'filename', value: heroFile.filename },
    data: { alt: src.hero.alt },
    filePath: heroFile.filePath,
    label: heroFile.filename,
  })
  const ogId = await upsert({
    collection: 'media',
    key: { field: 'filename', value: src.ogImage.filename },
    data: { alt: src.ogImage.alt },
    filePath: src.ogImage.filePath,
    label: src.ogImage.filename,
  })

  console.log('\nCollage')
  for (const piece of src.collageSources()) {
    await upsert({
      collection: 'collage',
      key: { field: 'filename', value: piece.filename },
      data: { alt: piece.alt, _status: 'published' },
      filePath: piece.filePath,
      label: piece.filename,
    })
  }

  console.log('\nSongs')
  for (const song of src.songSources()) {
    await upsert({
      collection: 'songs',
      key: { field: 'title', value: song.title },
      data: { title: song.title, artist: song.artist, duration: song.duration, _status: 'published' },
      filePath: song.filePath,
      label: `${song.title} (${song.filename})`,
    })
  }

  console.log('\nVideos')
  for (const video of src.videoSources()) {
    const posterId = await upsert({
      collection: 'media',
      key: { field: 'filename', value: video.posterFilename },
      data: { alt: video.posterAlt },
      filePath: video.posterPath,
      label: `${video.posterFilename} (poster)`,
    })
    await upsert({
      collection: 'videos',
      key: { field: 'youtubeUrl', value: video.youtubeUrl },
      data: {
        youtubeUrl: video.youtubeUrl,
        title: video.title,
        description: video.description,
        poster: posterId,
        _status: 'published',
      },
      label: video.title,
    })
  }

  return { portraitId, heroId, ogId }
}

// ---------------------------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------------------------

const seedGlobal = async (slug: GlobalSlug, build: () => Promise<Record<string, unknown>>, drafts: boolean) => {
  const current = (await payload.findGlobal({ slug, draft: true, depth: 0, overrideAccess: true, context })) as {
    updatedAt?: string
  }
  const seeded = Boolean(current?.updatedAt)
  if (seeded && !force) {
    tally.skipped++
    log('=', `${slug} (already saved ${current.updatedAt}; use --force to overwrite)`)
    return
  }
  const data = await build()
  if (!dryRun)
    await payload.updateGlobal({
      slug,
      data: (drafts ? { ...data, _status: 'published' } : data) as never,
      draft: false,
      overrideAccess: true,
      context,
      depth: 0,
    })
  if (seeded) tally.updated++
  else tally.created++
  log(seeded ? '~' : '+', `${slug}${drafts ? ' (published)' : ''}`)
}

const seedGlobals = async (ids: { portraitId: number | string; heroId: number | string; ogId: number | string }) => {
  console.log('\nPages and settings')
  await seedGlobal('home-page', async () => ({ ...src.homeFields, heroImage: ids.heroId, storyPortrait: ids.portraitId }), true)
  await seedGlobal(
    'about-page',
    async () => ({ ...src.aboutFields(), portrait: ids.portraitId, body: await markdownToLexical(config, src.aboutMd().body) }),
    true,
  )
  await seedGlobal('art-page', async () => src.artFields, true)
  await seedGlobal(
    'resources-page',
    async () => ({ ...src.resourcesFields(), body: await markdownToLexical(config, src.resourcesMd().body) }),
    true,
  )
  await seedGlobal(
    'contact-page',
    async () => ({ ...src.contactFields, about: await markdownToLexical(config, src.contactAboutMd) }),
    true,
  )
  await seedGlobal('site-settings', async () => ({ ...src.siteSettingsFields, shareImage: ids.ogId }), false)
}

// ---------------------------------------------------------------------------------------------
// Users (local development only needs these; production accounts are made by hand)
// ---------------------------------------------------------------------------------------------

const seedUsers = async () => {
  console.log('\nUsers')
  const existing = (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs
  if (existing > 0) {
    tally.skipped++
    log('=', `${existing} user(s) already exist; none created`)
    return
  }
  const accounts = [
    { role: 'admin', name: 'Developer', email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
    { role: 'editor', name: 'Becca Berry', email: process.env.SEED_EDITOR_EMAIL, password: process.env.SEED_EDITOR_PASSWORD },
  ]
  for (const a of accounts) {
    if (!a.email || !a.password) {
      log('!', `${a.role}: SEED_${a.role.toUpperCase()}_EMAIL / _PASSWORD not set in .env; skipped`)
      continue
    }
    if (!dryRun)
      await payload.create({
        collection: 'users',
        data: { email: a.email, password: a.password, name: a.name, role: a.role as 'admin' | 'editor' },
        overrideAccess: true,
        context,
      })
    tally.created++
    log('+', `${a.role}: ${a.email}`)
  }
}

// ---------------------------------------------------------------------------------------------

const before = await counts()
console.log(`Before: ${JSON.stringify(before)}${force ? '  [--force]' : ''}${dryRun ? '  [--dry-run: nothing is written]' : ''}`)
try {
  await seedUsers()
  const ids = await seedUploads()
  await seedGlobals(ids)
} catch (error) {
  console.error('\nSeed failed:', error)
  process.exit(1)
}
const after = await counts()
console.log(`\nAfter:  ${JSON.stringify(after)}`)
console.log(
  `Done. created ${tally.created}, updated ${tally.updated}, unchanged ${tally.unchanged}, skipped ${tally.skipped}.`,
)
process.exit(0)
