# Phase 3: content migration

Status: **done locally, 2026-09-22.** `pnpm seed` loads the content of the live Astro site into Payload. `pnpm verify:content` passes 202 of 202 checks against the legacy sources.

- **Seed:** `scripts/seed.ts`
- **Verifier:** `scripts/verify-content.ts`
- **Shared source readers:** `scripts/lib/legacy.ts`, `scripts/lib/richtext.ts`, `scripts/lib/guard.ts`

The source of truth is `legacy/astro/`, which is the build that `www.nothingwrongwithyou.org` serves today.

## What was migrated where

| Content | Legacy source | Payload destination |
| --- | --- | --- |
| 22 collage pieces (webp) + alt text | `src/assets/collage/*.webp`, `src/data/collage.json` | **Collage** collection. Sorted by id (collage-01 … collage-22) and published. Keyed by filename. The files are stored byte-for-byte. |
| 3 songs (MP3, 22 MB) + title, artist, length | `public/audio/*.mp3`, `src/data/songs.json`; order from `music.astro` | **Songs** collection, in the order we-survived, the-end, lullaby. Published and keyed by title. |
| 3 videos + title, description | `src/data/videos.json`; order from `videos.astro` | **Videos** collection, in the order shadowwork, mkultrasurvivor, judgement. `youtubeUrl` = `https://www.youtube.com/watch?v=<id>`. Published and keyed by YouTube link. |
| 3 video posters | `src/assets/video/<id>.jpg` | **Media**. Alt: `Cover image for the “<title>” video`. Linked as each video's `poster`. |
| Portrait | `src/assets/becca-portrait.webp`; alt from `about-me.astro` / `index.astro` | **Media** (one file). Used by `home-page.storyPortrait` and `about-page.portrait`. |
| Hero art | `src/assets/hero/commission-portrait.png` (18.1 MB, 2480×3508); alt from `index.astro` | **Media** `commission-portrait.webp`: 2000×2829, WebP q85, 1.4 MB, made with sharp during the seed because Workers can't resize. Set as `home-page.heroImage`. |
| Default share image | `public/og-default.jpg` (1200×630); alt = default `imageAlt` in `components/SEO.astro` | **Media**. Set as `site-settings.shareImage`. |
| Home copy (eyebrow, 2 buttons, manifesto lead-in, 4 lines, closing line, story quote and text, story button, doors heading and 3 labels, closing heading, text, triad and button) | Hardcoded in `pages/index.astro` | **Pages → Home** (published). |
| About intro (eyebrow, heading and pink part, lede, 4 affirmations, Instagram connect line) | Hardcoded in `pages/about-me.astro` | **Pages → About** (published). |
| About story | `content/pages/about.md` body | `about-page.body` (Lexical) |
| Art / Collage / Songs / Videos headings, Songs intro, Videos lede | `art.astro`, `collage-art.astro`, `music.astro`, `videos.astro` | **Pages → Art**, tabs `art` / `collage` / `songs` / `videos` (published). |
| Resources text | `content/pages/resources.md` body | `resources-page.body` (Lexical, published). |
| Contact header, 3 About paragraphs (incl. the “short video” link = `site.ts featuredMedia.video`), booking address and hint, 5 form topics | `pages/contact.astro`, `components/ContactForm.astro` | **Pages → Contact** (`about` is Lexical; published). |
| SEO title and description per page | `<BaseLayout title description>` in each page; frontmatter of `about.md` / `resources.md` | `seo.title` / `seo.description` on each page global (Art has one per tab). |
| Site name, tagline, owner, default description, 6 social links | `src/config/site.ts` | **Site Settings → General / Social links**. |
| Content note, 2 crisis lines, legal notice | `src/config/site.ts` `safety` | **Site Settings → Support messages**. All are on. Phone numbers are `988` and `+18006564673`. |
| Quick exit | `safety.quickExitUrl` (the component exists but is **not used** live) | Site Settings. `enabled: false`, and the URL is kept. |
| Formspree ID | `PUBLIC_FORMSPREE_ID` (not set in production) | Site Settings. Left empty, so the form is shown but can't be sent, same as the live site. |

### Rich text

Markdown is converted with `convertMarkdownToLexical`. It uses `editorConfigFactory.fromEditor({ editor: writingEditor })`, so the seeded JSON only contains nodes the admin editor supports. The result has been checked:

- **Structure matches the source:**
  - about: 26 paragraphs, 2 × H2, 2 bold runs
  - resources: 5 × H2, 3 bullet lists with 24 items, 9 bold runs, 4 italic runs (including the italic “Credit:” links), 19 links
  - contact: 3 paragraphs, 2 italic runs, 1 link
- **Formatting the site doesn't use yet also survives:** the verifier converts a sample with H2/H3/H4, bold, italic, links, bullet and numbered lists, a quote and a divider, and checks every one survives. None of the three pages uses a quote or a divider; those only appeared in the blog.
- **Two changes make the result match what visitors see today:**
  1. **Smart quotes.** Astro renders Markdown with SmartyPants, so `about.md`'s `I'm … "yes,"` is shown as `I’m … “yes,”`. The seed applies the same substitution to text runs only, never to URLs. The seeded text was compared with the live-rendered HTML (`legacy/astro/dist/*.html`) with **no** normalisation: about 28/28, resources 40/40 and contact 3/3 blocks are identical.
  2. **Autolinks.** `<https://…>` in `resources.md` (a CommonMark autolink, which the Lexical importer doesn't support) is rewritten to `[https://…](https://…)`. It renders the same way.
- **“Open in new tab” is not stored.** The editor hides that option, and the frontend opens external links in a new tab, as the Astro plugin did.

## Deliberately not migrated

| Item | Why |
| --- | --- |
| Blog (7 posts in `content/blog`, `pages/_blog`) | Out of scope (client decision 2026-09-22). It is hidden and returns 404 live. The posts stay in the Astro source and git history. |
| `featuredMedia.podcast` link | Not shown anywhere on the live site, and there is no field for it. It is still in `legacy/astro/src/config/site.ts` if it is ever needed. |
| 17 MB hero original (`legacy/astro/assets/`) and the full-size PNG | Too large to serve, and Workers can't resize. The 2000 px WebP is uploaded instead. The PNG stays in the repo if a re-export is ever needed. |
| Collage `title` / `year` | No source data. They are optional and left empty. |
| Component labels (“Content note”, “If you need support right now”, “Send a message”, form field labels, “About / Follow / Booking + Press” section labels, footer “Explore”, the 404 page) | Per the audit these are fixed in code, not CMS content. The frontend components carry them. |
| Main navigation | The routes are fixed, so there is no admin section (see 02-architecture). |

## Running it locally

```bash
pnpm payload migrate        # once, and after pulling new migrations
pnpm seed                   # idempotent; prints which database it writes to
pnpm verify:content         # read-only; exits 1 with a diff on any mismatch
```

Local data lives in `.wrangler/state/v3` (D1 SQLite and R2 objects). To start over, stop the dev server, delete `.wrangler/state`, run the migrations and seed again.

**Flags.** The package scripts end in `--` because `payload run` otherwise swallows flags. Use them as `pnpm seed --force`. If you call the script directly, write `pnpm payload run scripts/seed.ts -- --force`.

| Flag / env | Effect |
| --- | --- |
| *(none)* | Creates only what's missing. Existing items and already-saved globals are left alone, so the client's edits are never overwritten. It reports items whose fields differ from the legacy source (`edited since seeding; kept`). |
| `--dry-run` | Reports what it would do and writes nothing. |
| `--force` | Also resets already-seeded globals and the text fields of existing items to the legacy values. Uploaded files are never re-uploaded. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_EDITOR_EMAIL`, `SEED_EDITOR_PASSWORD` | Used only while the users table is empty. `.env.example` lists them empty. Local values are generated in `.env`, which is git-ignored. |

**Rerun behaviour.** Collection items are matched by filename (collage, media), title (songs) or YouTube link (videos). A rerun therefore creates nothing new, but it **re-adds a seeded item the client has deleted**. After handover, don't run the seed against production.

**Proof of idempotency** (2026-09-22):

| Run | Result | Counts after (collage / songs / videos / media / users) |
| --- | --- | --- |
| 1st | created 42 | 22 / 3 / 3 / 6 / 2 |
| 2nd | created 0, updated 0, unchanged 34, skipped 7 | 22 / 3 / 3 / 6 / 2 |

The R2 bucket holds 31 objects before and after, with no `-1` duplicates.

**What `verify:content` checks.** It reads only what the public can see (published documents).

- **Counts:** 22 / 3 / 3.
- **Collage:** order, and every alt text exact.
- **Songs:** title, artist, length and filename exact, in order.
- **Videos:** link, title and description exact, in order; poster filename and alt.
- **Media:** alt text on every image.
- **Page and settings fields:** every field on each page global and Site Settings. All five page globals must be published.
- **Rich text:**
  - Text equals the Markdown source, block by block (quotes and whitespace normalised). The Markdown is parsed independently of the Lexical converter.
  - The contact paragraphs are read straight from `contact.astro`, using JSX whitespace rules.
  - Every link URL in the source is present, with none extra.
  - Heading, bold, list-item and link counts match.
- **SEO:** every title and description equals the page's `<BaseLayout>` attributes or frontmatter.
- **Hardcoded strings:** each one is present in the CMS and also found in its legacy template.
- **Files:** each one is read back through Payload's R2 storage handler, then checked for byte size and a SHA-256 match with the source file.

## Running against production (later, with care)

The seed refuses to run when `PAYLOAD_REMOTE_BINDINGS=1` (real D1/R2), `NODE_ENV=production` or `CLOUDFLARE_ENV` is set, unless **both** `--allow-remote` is passed **and** `SEED_CONFIRM=I_UNDERSTAND` is set. It prints the target before doing anything.

```bash
# After `pnpm run deploy:database` has applied the migrations remotely:
PAYLOAD_REMOTE_BINDINGS=1 NODE_ENV=production SEED_CONFIRM=I_UNDERSTAND pnpm seed --dry-run --allow-remote
PAYLOAD_REMOTE_BINDINGS=1 NODE_ENV=production SEED_CONFIRM=I_UNDERSTAND pnpm seed --allow-remote
CLOUDFLARE_ENV=<env> NODE_ENV=production pnpm verify:content
```

- Leave the `SEED_*` user variables **unset** for production. Create the real accounts in `/admin` with strong passwords; Payload offers “create first user” while none exist.
- Run the seed once, before the client starts editing. Afterwards, use only `--dry-run` or `verify:content`.
- The upload is about 50 MB through Wrangler's remote proxy, so expect it to take a few minutes.
- **Untested:** remote runs have not been tried (the D1 IDs in `wrangler.jsonc` are still placeholders). The file check in `verify:content` uses the R2 adapter's non-Miniflare read path when `NODE_ENV=production`. If it reports HTTP 500 remotely, check the files in the admin or with `wrangler r2 object get`.

## URL, redirect and SEO inventory (for QA)

Canonical host: `https://www.nothingwrongwithyou.org`, with no trailing slash. The title pattern is `<seo.title> — Nothing Wrong With You`. The home page is the exception: `Nothing Wrong With You: You Can Save Yourself`, i.e. `siteName: tagline`.

### Indexed URLs (sitemap, 8)

| URL | `<title>` live | Description (live = seeded) | CMS field |
| --- | --- | --- | --- |
| `/` | Nothing Wrong With You: You Can Save Yourself | A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq. Nobody is coming to save you. You can save yourself. | `home-page.seo` |
| `/about-me` | About Me — Nothing Wrong With You | Becca Berry, Esq. is an attorney, artist and survivor. Read why she built Nothing Wrong With You, a spiritual and artistic platform for survivors who are tired of healing quietly. | `about-page.seo` |
| `/art` | Art — Nothing Wrong With You | Collage, writing, songs and mixed-media video art by Becca Berry, made as part of her healing and for other survivors. | `art-page.art.seo` |
| `/collage-art` | Collage — Nothing Wrong With You | Collage art by Becca Berry: cut-up magazines, headlines and faces rearranged into visual testimony, made as part of her healing. | `art-page.collage.seo` |
| `/music` | Songs — Nothing Wrong With You | Songs and demos by Becca Berry, including 30/We Survived, The End, and Lullaby with Galactic Monk. Listen here. | `art-page.songs.seo` |
| `/videos` | Videos — Nothing Wrong With You | Mixed media video art by Becca Berry: shadowwork, mkultrasurvivor and judgement. | `art-page.videos.seo` |
| `/resources` | Resources — Nothing Wrong With You | Definitions, declassified government documents and support websites that Becca Berry has found helpful for understanding trauma-based mind control. | `resources-page.seo` |
| `/contact` | Info + Contact — Nothing Wrong With You | About Nothing Wrong With You, Becca Berry’s social media, and how to reach her for booking, press and collaboration. Based in Los Angeles, CA. | `contact-page.seo` |

Not in the sitemap: the 404 page (`Page not found — Nothing Wrong With You`, `noindex`), `/blog` (404) and `/admin`. The new `robots.ts` should also disallow `/admin`.

### Redirects (301; from `legacy/astro/public/_redirects`, now in `next.config.ts`)

| From | To |
| --- | --- |
| `/new-page` | `/resources` |
| `/info-contact-carson` | `/contact` |
| `/cart` | `/` |

The two commented-out blog redirects (`/blog/tag/*`, `/blog/category/*`) stay out with the blog.

### Social and structured data

- **Every page:** `og:site_name`, `og:locale en_US`, `og:type website`, `og:title` = full title, `og:description`, `og:url` = canonical. `og:image` = the page's `seo.shareImage`, or else `site-settings.shareImage` (`/og-default.jpg`, 1200×630). `og:image:alt` = that image's alt (default: “Illustration of a woman’s face, half living and half skull, under a painted night sky of stars.”). Twitter tags: `summary_large_image`, with the same title, description, image and alt.
- **JSON-LD, home page only:**
  - `WebSite`: `name` = siteName, `url` = `https://www.nothingwrongwithyou.org`, `description` = `site-settings.defaultDescription`.
  - `Person`: `name` = “Becca Berry”, `honorificSuffix` “Esq.”, `url` = `…/about-me`, `sameAs` = the 6 social URLs, now `site-settings.social[*].url` in the same order.
  - Other pages have no JSON-LD.
