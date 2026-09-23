/**
 * Everything the seed writes, read from the legacy Astro site in `legacy/astro`.
 *
 * This module is the single source of truth for BOTH `scripts/seed.ts` and
 * `scripts/verify-content.ts`, so the verifier compares the database against the same
 * values the seed was built from. Hardcoded strings below are copied verbatim from the
 * named `.astro` file (see the comment on each); structured data is read from the JSON and
 * Markdown files at runtime.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(here, '..', '..')
export const legacyRoot = path.join(repoRoot, 'legacy', 'astro')
export const legacy = (...parts: string[]) => path.join(legacyRoot, ...parts)

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(legacy(file), 'utf8')) as T

/** Splits a Markdown file into its YAML frontmatter (simple `key: value` lines) and body. */
export const readMarkdown = (file: string) => {
  const raw = fs.readFileSync(legacy(file), 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error(`No frontmatter in ${file}`)
  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) data[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return { data, body: match[2] }
}

/**
 * Astro renders Markdown with SmartyPants, so the live site shows ’ “ ” where the source has
 * ' and ". Lexical stores text as typed, so the seed applies the same substitution to text
 * (never to URLs) to reproduce exactly what visitors see today.
 */
export const smartQuotes = (text: string) =>
  text
    .replace(/(\w)'(\w)/g, '$1’$2') // it's, can't
    .replace(/'(\w)/g, '‘$1')
    .replace(/'/g, '’')
    .replace(/(^|[\s(\[{—–-])"/g, '$1“')
    .replace(/"/g, '”')

/**
 * Lexical's Markdown importer has no CommonMark autolinks (`<https://…>`). An autolink renders
 * exactly like `[url](url)`, so rewrite it that way before converting.
 */
export const expandAutolinks = (markdown: string) =>
  markdown.replace(/<(https?:\/\/[^>\s]+)>/g, '[$1]($1)')

// ---------------------------------------------------------------------------------------------
// Site-wide (legacy/astro/src/config/site.ts and components/SEO.astro)
// ---------------------------------------------------------------------------------------------

/** From `src/config/site.ts` (verbatim). Not imported directly: it uses `import.meta.env`. */
export const site = {
  name: 'Nothing Wrong With You',
  tagline: 'You Can Save Yourself',
  url: 'https://www.nothingwrongwithyou.org',
  owner: 'Becca Berry',
  defaultDescription:
    'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq.',
  social: [
    { label: 'Instagram (personal)', url: 'https://www.instagram.com/beccaberry' },
    { label: 'Instagram (art)', url: 'https://www.instagram.com/nothingwrongwithus' },
    { label: 'Facebook', url: 'https://www.facebook.com/nothingwrongwithyouorg/' },
    { label: 'Twitter', url: 'https://twitter.com/mksurvivor' },
    { label: 'Threads', url: 'https://www.threads.com/@beccaberry' },
    { label: 'YouTube', url: 'https://www.youtube.com/@nothingwrongwithus' },
  ],
  featuredMedia: {
    video: 'https://www.youtube.com/watch?t=15s&v=xayXIaq3V4M',
    podcast:
      'https://podcasters.spotify.com/pod/show/bobo-matjila/episodes/i-was-raised-by-a-narcissist-ekm068',
  },
  safety: {
    contentNote:
      'Some of what is shared here discusses abuse and other trauma. Take breaks, and leave whenever you need to.',
    quickExitUrl: 'https://www.google.com/',
    crisis: [
      { name: '988 Suicide & Crisis Lifeline (US)', how: 'Call or text 988', phone: '988' },
      {
        name: 'RAINN National Sexual Assault Hotline (US)',
        how: 'Call 1-800-656-4673',
        phone: '+18006564673',
      },
    ],
    legalNotice:
      'This site is for education and creative expression. Nothing here is legal advice, and visiting it does not create an attorney-client relationship.',
  },
} as const

/** Default `imageAlt` in `src/components/SEO.astro` (describes `/og-default.jpg`). */
export const ogDefaultAlt =
  'Illustration of a woman’s face, half living and half skull, under a painted night sky of stars.'

// ---------------------------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------------------------

export type CollageSource = { id: string; image: string; alt: string }
export type SongSource = { id: string; title: string; artist: string; duration: string; src: string }
export type VideoSource = { id: string; title: string; description: string; youtubeId: string; poster: string }

export const collageSources = () =>
  readJson<CollageSource[]>('src/data/collage.json')
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => ({
      ...c,
      filename: path.basename(c.image),
      filePath: path.resolve(legacy('src/data'), c.image),
    }))

/** Order hardcoded in `src/pages/music.astro`. */
export const songOrder = ['we-survived', 'the-end', 'lullaby']
export const songSources = () => {
  const songs = readJson<SongSource[]>('src/data/songs.json')
  return songOrder.map((id) => {
    const s = songs.find((x) => x.id === id)
    if (!s) throw new Error(`songs.json has no "${id}"`)
    return { ...s, filename: path.basename(s.src), filePath: legacy('public', s.src) }
  })
}

/** Order hardcoded in `src/pages/videos.astro`. */
export const videoOrder = ['shadowwork', 'mkultrasurvivor', 'judgement']
export const videoSources = () => {
  const videos = readJson<VideoSource[]>('src/data/videos.json')
  return videoOrder.map((id) => {
    const v = videos.find((x) => x.id === id)
    if (!v) throw new Error(`videos.json has no "${id}"`)
    return {
      ...v,
      youtubeUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
      posterFilename: path.basename(v.poster),
      posterPath: path.resolve(legacy('src/data'), v.poster),
      posterAlt: `Cover image for the “${v.title}” video`,
    }
  })
}

/** `src/pages/index.astro` and `src/pages/about-me.astro` (same alt on both). */
export const portrait = {
  filename: 'becca-portrait.webp',
  filePath: legacy('src/assets/becca-portrait.webp'),
  alt: 'Becca Berry looking directly at the camera, with russet locs and a sheer black rose-print top.',
}

/** `src/pages/index.astro` hero `<Picture>`. The PNG is converted to WebP by the seed if large. */
export const hero = {
  sourcePath: legacy('src/assets/hero/commission-portrait.png'),
  filename: 'commission-portrait.webp',
  alt: 'Illustration of a woman’s face, half living and half skull, framed by long dark red hair under a painted night sky of stars.',
}

export const ogImage = {
  filename: 'og-default.jpg',
  filePath: legacy('public/og-default.jpg'),
  alt: ogDefaultAlt,
}

// ---------------------------------------------------------------------------------------------
// Rich text sources (Markdown)
// ---------------------------------------------------------------------------------------------

export const aboutMd = () => readMarkdown('src/content/pages/about.md')
export const resourcesMd = () => readMarkdown('src/content/pages/resources.md')

/**
 * The three "About" paragraphs hardcoded in `src/pages/contact.astro`, as Markdown.
 * Whitespace is collapsed exactly as the rendered page shows it; the link is
 * `featuredMedia.video` from `src/config/site.ts`.
 */
export const contactAboutMd = [
  '*Nothing Wrong With You* is a spiritual and artistic storytelling platform for survivors curated by Becca Berry, Esq. I believe that every survivor deserves to heal and thrive, and I am committed to providing survivors with the space they need to do so.',
  `Welcome to *Nothing Wrong With You*. To learn a little more about Becca Berry’s story, you can watch this [short video](${site.featuredMedia.video}).`,
  'I am open to sharing more and collaborating with other survivors so please feel free to contact me on any of the linked social media platforms or send me a message.',
].join('\n\n')

// ---------------------------------------------------------------------------------------------
// Page globals: plain fields (everything except uploads and rich text)
// ---------------------------------------------------------------------------------------------

const lines = (items: string[]) => items.map((line) => ({ line }))

/** `src/pages/index.astro` */
export const homeFields = {
  eyebrow: 'Becca Berry, Esq.',
  primaryButton: { text: 'Read Becca’s story', page: '/about-me' },
  secondaryButton: { text: 'See the collages', page: '/collage-art' },
  leadIn: 'Nobody is coming to save you.',
  stanzas: lines(['You’re not alone.', 'You’re not too much.', 'You’re not crazy.', 'You survived.']),
  closingLine: 'For the ones who survived what they can’t say out loud—yet',
  storyQuote: 'I’m Becca Berry, Esq., and I’m done pretending healing is pretty.',
  storyText:
    'I’m a survivor. A truth-teller. A California-raised attorney who realized the law could sometimes protect people but couldn’t save them, so I learned about the magic that could. I write, sing, collage, and conjure because my healing demanded it.',
  storyButton: { text: 'Read the whole story', page: '/about-me' },
  doorsHeading: 'Art, in every form',
  collageDoor: 'Look',
  songsDoor: 'Listen',
  videosDoor: 'Watch',
  closingHeading: 'If you found this website, it’s not an accident.',
  closingText: 'If something in these words made your body say “yes,” trust that. You’re in the right place.',
  closingWords: 'Magic. Art. Truth.',
  closingButton: { text: 'Get in touch', page: '/contact' },
  seo: {
    // index.astro: `title={site.name}` (rendered as "Nothing Wrong With You: You Can Save Yourself").
    title: site.name,
    description:
      'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq. Nobody is coming to save you. You can save yourself.',
  },
}

/** `src/pages/about-me.astro` + frontmatter of `about.md` */
export const aboutFields = () => {
  const { data } = aboutMd()
  return {
    eyebrow: 'About Me',
    heading: 'Nobody is coming to save you.',
    headingEmphasis: 'You can save yourself!',
    lede: 'For the ones who survived what they can’t say out loud—yet',
    affirmations: lines(['You’re not alone.', 'You’re not too much.', 'You’re not crazy.', 'You survived.']),
    connectText: 'Connect with Becca Berry',
    connectLabel: '@beccaberry',
    connectUrl: 'https://www.instagram.com/beccaberry',
    seo: { title: data.title, description: data.description },
  }
}

/** `art.astro`, `collage-art.astro`, `music.astro`, `videos.astro` */
export const artFields = {
  art: {
    heading: 'I create art because silence was killing me.',
    seo: {
      title: 'Art',
      description:
        'Collage, writing, songs and mixed-media video art by Becca Berry, made as part of her healing and for other survivors.',
    },
  },
  collage: {
    heading: 'Collage',
    seo: {
      title: 'Collage',
      description:
        'Collage art by Becca Berry: cut-up magazines, headlines and faces rearranged into visual testimony, made as part of her healing.',
    },
  },
  songs: {
    heading: 'Songs',
    intro:
      'I’ll be adding demos that I’ve been working on, just expressing and getting these songs out of me while also finding my sound.',
    seo: {
      title: 'Songs',
      description:
        'Songs and demos by Becca Berry, including 30/We Survived, The End, and Lullaby with Galactic Monk. Listen here.',
    },
  },
  videos: {
    heading: 'Videos',
    lede: 'Mixed Media Video Art',
    seo: {
      title: 'Videos',
      description: 'Mixed media video art by Becca Berry: shadowwork, mkultrasurvivor and judgement.',
    },
  },
}

/** `src/pages/resources.astro` + frontmatter of `resources.md` */
export const resourcesFields = () => {
  const { data } = resourcesMd()
  return { heading: 'Resources', seo: { title: data.title, description: data.description } }
}

/** `src/pages/contact.astro` + topics from `src/components/ContactForm.astro` */
export const contactFields = {
  eyebrow: 'Info + Contact',
  heading: 'I’d love to hear from you',
  lede: 'About me, social media, and how to get in touch',
  bookingAddress: 'Becca Berry\nLos Angeles, CA',
  bookingHint: 'Choose “Booking” or “Press” in the form.',
  topics: ['Booking', 'Press', 'Collaboration', 'Support', 'Something else'].map((topic) => ({ topic })),
  seo: {
    title: 'Info + Contact',
    description:
      'About Nothing Wrong With You, Becca Berry’s social media, and how to reach her for booking, press and collaboration. Based in Los Angeles, CA.',
  },
}

/** `src/config/site.ts`. Quick exit is off: `QuickExit.astro` is not used on the live site. */
export const siteSettingsFields = {
  siteName: site.name,
  tagline: site.tagline,
  ownerName: site.owner,
  defaultDescription: site.defaultDescription,
  social: site.social.map((s) => ({ ...s })),
  safety: {
    contentNote: { enabled: true, text: site.safety.contentNote },
    crisis: { enabled: true, lines: site.safety.crisis.map((l) => ({ ...l })) },
    legalNotice: { enabled: true, text: site.safety.legalNotice },
    quickExit: { enabled: false, url: site.safety.quickExitUrl },
  },
  // PUBLIC_FORMSPREE_ID is not set on the live site, so the form stays disabled until it is.
  contactForm: { formspreeId: null as string | null },
}

/**
 * Every visible string hardcoded in the Astro page templates that the CMS now owns.
 * `verify-content` checks each one appears in the named global.
 */
export const hardcodedStrings: Record<string, string[]> = {
  'home-page': [
    homeFields.eyebrow,
    homeFields.primaryButton.text,
    homeFields.secondaryButton.text,
    homeFields.leadIn,
    ...homeFields.stanzas.map((s) => s.line),
    homeFields.closingLine,
    homeFields.storyQuote,
    homeFields.storyText,
    homeFields.storyButton.text,
    homeFields.doorsHeading,
    homeFields.collageDoor,
    homeFields.songsDoor,
    homeFields.videosDoor,
    homeFields.closingHeading,
    homeFields.closingText,
    homeFields.closingWords,
    homeFields.closingButton.text,
    homeFields.seo.description,
  ],
  'about-page': [
    'About Me',
    'Nobody is coming to save you.',
    'You can save yourself!',
    'For the ones who survived what they can’t say out loud—yet',
    'You’re not alone.',
    'You’re not too much.',
    'You’re not crazy.',
    'You survived.',
    'Connect with Becca Berry',
    '@beccaberry',
    'https://www.instagram.com/beccaberry',
  ],
  'art-page': [
    artFields.art.heading,
    artFields.art.seo.description,
    artFields.collage.seo.description,
    artFields.songs.intro,
    artFields.songs.seo.description,
    artFields.videos.lede,
    artFields.videos.seo.description,
  ],
  'contact-page': [
    contactFields.eyebrow,
    contactFields.heading,
    contactFields.lede,
    'Becca Berry',
    'Los Angeles, CA',
    contactFields.bookingHint,
    ...contactFields.topics.map((t) => t.topic),
    contactFields.seo.description,
  ],
  'site-settings': [
    site.name,
    site.tagline,
    site.owner,
    site.defaultDescription,
    ...site.social.flatMap((s) => [s.label, s.url]),
    site.safety.contentNote,
    ...site.safety.crisis.flatMap((c) => [c.name, c.how, c.phone]),
    site.safety.legalNotice,
  ],
}
