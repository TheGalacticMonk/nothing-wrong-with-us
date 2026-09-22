/**
 * Reads the CMS back and compares it with the legacy Astro sources. Read-only.
 *
 *   pnpm verify:content
 *
 * Exits 1 with a diff for every mismatch. Checks are made against the legacy files themselves
 * (JSON, Markdown, and the `.astro` templates) wherever possible, not against the seed's
 * copies, so a typo in the seed data is caught too.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { guardTarget } from './lib/guard'
import * as src from './lib/legacy'
import { lexicalLinks, lexicalStructure, lexicalToText, markdownToLexical, type LexicalState } from './lib/richtext'

guardTarget('verify:content', { writes: false })
process.env.PAYLOAD_MIGRATING = 'true' // never push schema from a script; migrations own it
// @payloadcms/storage-r2 only uses its Miniflare-compatible read path when NODE_ENV is
// "development" (otherwise reading a local R2 object fails with HTTP 500).
if (!process.env.NODE_ENV) (process.env as Record<string, string>).NODE_ENV = 'development'

const { default: configPromise } = await import('@payload-config')
const { getPayload, createLocalReq } = await import('payload')
const config = await configPromise
const payload = await getPayload({ config })

// ---------------------------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------------------------

let checks = 0
const failures: string[] = []
const section = (name: string) => console.log(`\n${name}`)
const ok = (label: string) => {
  checks++
  console.log(`  ✓ ${label}`)
}
const fail = (label: string, detail: string) => {
  checks++
  failures.push(`${label}\n${detail}`)
  console.log(`  ✗ ${label}\n${detail.replace(/^/gm, '      ')}`)
}

/** Shows where two strings first differ, with context. */
const stringDiff = (expected: string, actual: string) => {
  let i = 0
  while (i < expected.length && expected[i] === actual[i]) i++
  const ctx = (s: string) => JSON.stringify(s.slice(Math.max(0, i - 40), i + 60))
  return `first difference at char ${i}\nexpected: ${ctx(expected)}\nactual:   ${ctx(actual)}`
}
const expectEqual = (label: string, expected: unknown, actual: unknown) => {
  const e = typeof expected === 'string' ? expected : JSON.stringify(expected)
  const a = typeof actual === 'string' ? actual : JSON.stringify(actual)
  if (e === a) ok(label)
  else fail(label, typeof expected === 'string' && typeof actual === 'string' ? stringDiff(e, a) : `expected: ${e}\nactual:   ${a}`)
}

/** Whitespace and typographic quotes are normalised (the live site shows smart quotes). */
const norm = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'id').map(([k, v]) => [k, stripIds(v)]))
  return value
}

/** Compares every key of `expected` (recursively) with `actual`. */
const expectSubset = (label: string, expected: Record<string, unknown>, actual: Record<string, unknown> | undefined) => {
  const walk = (prefix: string, e: unknown, a: unknown) => {
    if (e && typeof e === 'object' && !Array.isArray(e)) {
      for (const [k, v] of Object.entries(e)) walk(prefix ? `${prefix}.${k}` : k, v, (a as Record<string, unknown>)?.[k])
      return
    }
    expectEqual(`${label}: ${prefix}`, stripIds(e ?? null), stripIds(a ?? null))
  }
  walk('', expected, actual)
}

// ---------------------------------------------------------------------------------------------
// Independent readers for the legacy sources
// ---------------------------------------------------------------------------------------------

/** Markdown -> plain-text blocks, without the Lexical converter (so the converter is tested). */
const markdownBlocks = (markdown: string) =>
  markdown
    .split(/\n\s*\n/)
    .flatMap((block) => (/^\s*([-*]|\d+\.)\s/m.test(block) ? block.split('\n') : [block]))
    .map((b) =>
      b
        .replace(/^\s*(#{1,6}|[-*]|\d+\.|>)\s+/gm, '')
        .replace(/^\s*---\s*$/gm, '')
        .replace(/<(https?:\/\/[^>\s]+)>/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\*\*|\*|__/g, ''),
    )
    .map(norm)
    .filter(Boolean)

const markdownLinks = (markdown: string) => [
  ...[...markdown.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
  ...[...markdown.matchAll(/<(https?:\/\/[^>\s]+)>/g)].map((m) => m[1]),
]

const markdownStructure = (markdown: string) => ({
  h2: (markdown.match(/^## /gm) ?? []).length,
  bold: (markdown.match(/\*\*[^*]+\*\*/g) ?? []).length,
  listItems: (markdown.match(/^\s*([-*]|\d+\.)\s/gm) ?? []).length,
  links: markdownLinks(markdown).length,
})

/** Applies JSX text rules (as Astro does): trim lines, drop blank ones, join with spaces. */
const jsxText = (text: string) => {
  const lines = text.split(/\r?\n/)
  if (lines.length === 1) return text
  const kept = lines
    .map((line, i) => {
      let l = line
      if (i > 0) l = l.replace(/^\s+/, '')
      if (i < lines.length - 1) l = l.replace(/\s+$/, '')
      return l
    })
    .filter((l) => l !== '')
  return kept.join(' ')
}

/** Visible text of an Astro template fragment: tags removed, `{' '}` kept, JSX whitespace applied. */
const astroText = (fragment: string) =>
  fragment
    .split(/(<[^>]*>|\{[^}]*\})/)
    .map((part) => (part.startsWith('<') ? '\u0000' : part === "{' '}" ? ' ' : part.startsWith('{') ? '\u0000' : jsxText(part)))
    .join('')
    .split('\u0000')
    .join('')

const readLegacy = (file: string) => fs.readFileSync(src.legacy(file), 'utf8')
/** Whole-file searchable text (template markup stripped, whitespace collapsed). */
const legacySearchText = (files: string[]) =>
  files
    .map((f) => readLegacy(f))
    .flatMap((raw) => [norm(raw), norm(raw.replace(/<[^>]*>/g, '').replace(/\{' '\}/g, ' '))])
    .join('\n')

const baseLayoutProps = (file: string) => {
  const text = readLegacy(file)
  const tag = text.match(/<BaseLayout([\s\S]*?)>/)?.[1] ?? ''
  const attr = (name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? tag.match(new RegExp(`${name}=\\{([^}]*)\\}`))?.[1]
  return { title: attr('title'), description: attr('description') }
}

// ---------------------------------------------------------------------------------------------
// Files in R2 (read through Payload's own storage handler, i.e. exactly what the site serves)
// ---------------------------------------------------------------------------------------------

const sha = (buf: Buffer | Uint8Array) => crypto.createHash('sha256').update(buf).digest('hex')
const localReq = await createLocalReq({}, payload)

const readStoredFile = async (collection: 'media' | 'collage' | 'songs', doc: { filename?: string | null }) => {
  const upload = payload.collections[collection].config.upload
  const handlers = (typeof upload === 'object' && upload.handlers) || []
  for (const handler of handlers) {
    const res = (await handler(localReq, {
      doc: doc as never,
      headers: new Headers(),
      params: { collection, filename: doc.filename ?? '' },
    })) as Response | undefined
    if (res instanceof Response) {
      if (!res.ok) return { status: res.status, bytes: undefined }
      return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) }
    }
  }
  return { status: 0, bytes: undefined }
}

const expectStoredFile = async (
  collection: 'media' | 'collage' | 'songs',
  doc: { filename?: string | null; filesize?: number | null },
  sourcePath: string | undefined,
) => {
  const label = `file ${collection}/${doc.filename} readable from R2`
  const { status, bytes } = await readStoredFile(collection, doc)
  if (!bytes) return fail(label, `storage handler returned HTTP ${status}`)
  if (bytes.length !== doc.filesize) return fail(label, `stored ${bytes.length} bytes, document says ${doc.filesize}`)
  if (sourcePath && fs.existsSync(sourcePath)) {
    const source = fs.readFileSync(sourcePath)
    if (sha(source) !== sha(bytes)) return fail(label, `content differs from ${path.relative(src.repoRoot, sourcePath)}`)
    return ok(`${label} (${(bytes.length / 1e6).toFixed(2)} MB, identical to source)`)
  }
  ok(`${label} (${(bytes.length / 1e6).toFixed(2)} MB)`)
}

// ---------------------------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------------------------

type Doc = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const findAll = async (collection: 'collage' | 'songs' | 'videos' | 'media') =>
  (
    await payload.find({
      collection,
      limit: 0,
      pagination: false,
      depth: 1,
      sort: collection === 'media' ? 'id' : '_order',
      overrideAccess: false, // what the public site can see: published items only
    })
  ).docs as Doc[]

const checkCollections = async () => {
  section('Counts (published, as the public sees them)')
  const collage = await findAll('collage')
  const songs = await findAll('songs')
  const videos = await findAll('videos')
  const media = (await payload.find({ collection: 'media', limit: 0, pagination: false, depth: 0, overrideAccess: true })).docs as Doc[]
  const collageSrc = src.collageSources()
  const songSrc = src.songSources()
  const videoSrc = src.videoSources()
  expectEqual('collage count', collageSrc.length, collage.length)
  expectEqual('songs count', songSrc.length, songs.length)
  expectEqual('videos count', videoSrc.length, videos.length)
  if (collageSrc.length !== 22 || songSrc.length !== 3 || videoSrc.length !== 3)
    fail('legacy source counts', `expected 22/3/3 in legacy JSON, found ${collageSrc.length}/${songSrc.length}/${videoSrc.length}`)

  section('Collage (order, alt text, files)')
  expectEqual(
    'collage order (by filename, collage-01 … collage-22)',
    collageSrc.map((c) => c.filename),
    collage.map((c) => c.filename),
  )
  for (const piece of collageSrc) {
    const doc = collage.find((c) => c.filename === piece.filename)
    if (!doc) {
      fail(`collage ${piece.filename}`, 'missing')
      continue
    }
    expectEqual(`collage ${piece.filename} alt`, piece.alt, doc.alt)
    await expectStoredFile('collage', doc, piece.filePath)
  }

  section('Songs')
  expectEqual('songs order', songSrc.map((s) => s.title), songs.map((s) => s.title))
  for (const song of songSrc) {
    const doc = songs.find((s) => s.title === song.title)
    if (!doc) {
      fail(`song ${song.title}`, 'missing')
      continue
    }
    expectSubset(`song ${song.id}`, { title: song.title, artist: song.artist, duration: song.duration, filename: song.filename }, doc)
    await expectStoredFile('songs', doc, song.filePath)
  }

  section('Videos')
  expectEqual('videos order', videoSrc.map((v) => v.youtubeUrl), videos.map((v) => v.youtubeUrl))
  for (const video of videoSrc) {
    const doc = videos.find((v) => v.youtubeUrl === video.youtubeUrl)
    if (!doc) {
      fail(`video ${video.title}`, 'missing')
      continue
    }
    expectSubset(`video ${video.id}`, { title: video.title, description: video.description }, doc)
    expectSubset(`video ${video.id} poster`, { filename: video.posterFilename, alt: video.posterAlt }, doc.poster)
    if (doc.poster) await expectStoredFile('media', doc.poster, video.posterPath)
  }

  section('Images (media)')
  const heroWebp = path.join((await import('node:os')).tmpdir(), 'nwwy-seed', src.hero.filename)
  const expectedMedia = [
    { ...src.portrait, sourcePath: src.portrait.filePath },
    { ...src.hero, sourcePath: fs.existsSync(heroWebp) ? heroWebp : undefined },
    { ...src.ogImage, sourcePath: src.ogImage.filePath },
  ]
  for (const m of expectedMedia) {
    const doc = media.find((d) => d.filename === m.filename)
    if (!doc) {
      fail(`media ${m.filename}`, 'missing')
      continue
    }
    expectEqual(`media ${m.filename} alt`, m.alt, doc.alt)
    await expectStoredFile('media', doc, m.sourcePath)
  }
  return { portraitName: src.portrait.filename, heroName: src.hero.filename, ogName: src.ogImage.filename }
}

const findGlobal = async (slug: Parameters<typeof payload.findGlobal>[0]['slug']) =>
  (await payload.findGlobal({ slug, depth: 1, overrideAccess: false })) as Doc // published version only

const checkRichText = async (label: string, markdown: string, state: LexicalState | undefined) => {
  if (!state?.root) return fail(`${label} rich text`, 'empty')
  const expectedBlocks = markdownBlocks(markdown)
  const actualBlocks = lexicalToText(state).split('\n\n').map(norm).filter(Boolean)
  if (JSON.stringify(expectedBlocks) === JSON.stringify(actualBlocks)) ok(`${label}: all ${expectedBlocks.length} blocks of text match the source`)
  else {
    const i = expectedBlocks.findIndex((b, n) => b !== actualBlocks[n])
    const idx = i === -1 ? expectedBlocks.length : i
    fail(
      `${label}: text`,
      `block ${idx + 1} of ${expectedBlocks.length} (db has ${actualBlocks.length})\n${stringDiff(expectedBlocks[idx] ?? '', actualBlocks[idx] ?? '')}`,
    )
  }
  const expectedLinks = markdownLinks(markdown)
  const actualLinks = lexicalLinks(state)
  const missing = expectedLinks.filter((u) => !actualLinks.includes(u))
  const extra = actualLinks.filter((u) => !expectedLinks.includes(u))
  if (!missing.length && !extra.length && expectedLinks.length === actualLinks.length) ok(`${label}: all ${expectedLinks.length} links present`)
  else fail(`${label}: links`, `missing: ${JSON.stringify(missing)}\nunexpected: ${JSON.stringify(extra)}`)
  const s = lexicalStructure(state)
  const m = markdownStructure(markdown)
  expectEqual(
    `${label}: structure (h2 / bold runs / list items / links)`,
    m,
    { h2: s['heading:h2'] ?? 0, bold: s['format:bold'] ?? 0, listItems: s.listitem ?? 0, links: s.link ?? 0 },
  )
}

const checkGlobals = async (names: { portraitName: string; heroName: string; ogName: string }) => {
  const home = await findGlobal('home-page')
  const about = await findGlobal('about-page')
  const art = await findGlobal('art-page')
  const resources = await findGlobal('resources-page')
  const contact = await findGlobal('contact-page')
  const settings = await findGlobal('site-settings')

  section('Home page')
  expectEqual('home: published', 'published', home._status)
  expectSubset('home', src.homeFields, home)
  expectSubset('home heroImage', { filename: names.heroName, alt: src.hero.alt }, home.heroImage)
  expectSubset('home storyPortrait', { filename: names.portraitName, alt: src.portrait.alt }, home.storyPortrait)

  section('About page')
  expectEqual('about: published', 'published', about._status)
  expectSubset('about', src.aboutFields(), about)
  expectSubset('about portrait', { filename: names.portraitName }, about.portrait)
  await checkRichText('about body', src.aboutMd().body, about.body)

  section('Art pages')
  expectEqual('art: published', 'published', art._status)
  expectSubset('art', src.artFields, art)

  section('Resources page')
  expectEqual('resources: published', 'published', resources._status)
  expectSubset('resources', src.resourcesFields(), resources)
  await checkRichText('resources body', src.resourcesMd().body, resources.body)

  section('Contact page')
  expectEqual('contact: published', 'published', contact._status)
  expectSubset('contact', src.contactFields, contact)
  // The About paragraphs, read straight from contact.astro.
  const contactAstro = readLegacy('src/pages/contact.astro')
  const prose = contactAstro.match(/<div class="prose">([\s\S]*?)<\/div>/)?.[1] ?? ''
  const paragraphs = [...prose.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => norm(astroText(p[1])))
  const contactText = lexicalToText(contact.about).split('\n\n').map(norm)
  expectEqual('contact about: text equals contact.astro paragraphs', paragraphs, contactText)
  const contactHrefs = [...prose.matchAll(/href=\{featuredMedia\.(\w+)\}/g)].map(
    (m) => src.site.featuredMedia[m[1] as keyof typeof src.site.featuredMedia],
  )
  expectEqual('contact about: links', contactHrefs, lexicalLinks(contact.about))
  const cs = lexicalStructure(contact.about)
  expectEqual('contact about: italics (2 × <em>)', (prose.match(/<em>/g) ?? []).length, cs['format:italic'] ?? 0)

  section('Site settings')
  expectSubset('site-settings', src.siteSettingsFields, settings)
  expectSubset('site-settings shareImage', { filename: names.ogName, alt: src.ogDefaultAlt }, settings.shareImage)
  expectEqual('site-settings: quick exit off (not on the live site)', false, settings.safety?.quickExit?.enabled)

  section('SEO titles and descriptions (from each page’s <BaseLayout>)')
  const pages: { file: string; seo: { title?: string; description?: string } | undefined }[] = [
    { file: 'src/pages/index.astro', seo: home.seo },
    { file: 'src/pages/art.astro', seo: art.art?.seo },
    { file: 'src/pages/collage-art.astro', seo: art.collage?.seo },
    { file: 'src/pages/music.astro', seo: art.songs?.seo },
    { file: 'src/pages/videos.astro', seo: art.videos?.seo },
    { file: 'src/pages/contact.astro', seo: contact.seo },
  ]
  for (const p of pages) {
    const props = baseLayoutProps(p.file)
    const title = props.title === 'site.name' ? src.site.name : props.title
    expectEqual(`${p.file} title`, title, p.seo?.title)
    expectEqual(`${p.file} description`, props.description, p.seo?.description)
  }
  for (const [file, seo] of [
    ['src/content/pages/about.md', about.seo],
    ['src/content/pages/resources.md', resources.seo],
  ] as const) {
    const { data } = src.readMarkdown(file)
    expectEqual(`${file} title`, data.title, seo?.title)
    expectEqual(`${file} description`, data.description, seo?.description)
  }

  section('Every hardcoded Astro string is in the CMS and in the legacy template')
  const sources: Record<string, string[]> = {
    'home-page': ['src/pages/index.astro'],
    'about-page': ['src/pages/about-me.astro'],
    'art-page': ['src/pages/art.astro', 'src/pages/collage-art.astro', 'src/pages/music.astro', 'src/pages/videos.astro'],
    'contact-page': ['src/pages/contact.astro', 'src/components/ContactForm.astro'],
    'site-settings': ['src/config/site.ts'],
  }
  const docs: Record<string, Doc> = {
    'home-page': home,
    'about-page': about,
    'art-page': art,
    'contact-page': contact,
    'site-settings': settings,
  }
  const flatten = (v: unknown): string[] =>
    typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(flatten) : []
  for (const [slug, strings] of Object.entries(src.hardcodedStrings)) {
    const inTemplate = legacySearchText(sources[slug])
    const inCms = norm(flatten(docs[slug]).join('\n'))
    const notInTemplate = strings.filter((s) => !inTemplate.includes(norm(s)))
    const notInCms = strings.filter((s) => !inCms.includes(norm(s)))
    if (notInTemplate.length) fail(`${slug}: strings not found in ${sources[slug].join(', ')}`, notInTemplate.join('\n'))
    if (notInCms.length) fail(`${slug}: strings missing from the CMS`, notInCms.join('\n'))
    if (!notInTemplate.length && !notInCms.length) ok(`${slug}: ${strings.length} strings`)
  }
}

/** Proves the editor config keeps every formatting feature the site's writing uses. */
const checkConverter = async () => {
  section('Rich-text converter keeps all formatting the site uses')
  const sample = [
    '## Heading two',
    '### Heading three',
    '#### Heading four',
    'Some **bold**, *italic* and ***both***, with a [link](https://example.com).',
    '- bullet one',
    '- bullet two',
    '',
    '1. first',
    '2. second',
    '',
    '> A quote',
    '',
    '---',
    '',
    'After the rule.',
  ].join('\n')
  const s = lexicalStructure(await markdownToLexical(config, sample))
  const want = ['heading:h2', 'heading:h3', 'heading:h4', 'format:bold', 'format:italic', 'link', 'list:bullet', 'list:number', 'quote', 'horizontalrule']
  const missing = want.filter((k) => !s[k])
  if (missing.length) fail('converter', `lost: ${missing.join(', ')}\ngot: ${JSON.stringify(s)}`)
  else ok(`converter keeps ${want.join(', ')}`)
}

// ---------------------------------------------------------------------------------------------

try {
  await checkConverter()
  const names = await checkCollections()
  await checkGlobals(names)
} catch (error) {
  fail('verify crashed', String((error as Error)?.stack ?? error))
}

console.log(`\n${checks - failures.length}/${checks} checks passed.`)
if (failures.length) {
  console.error(`\n${failures.length} mismatch(es):\n\n${failures.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}`)
  process.exit(1)
}
console.log('Content matches the legacy site.')
process.exit(0)
