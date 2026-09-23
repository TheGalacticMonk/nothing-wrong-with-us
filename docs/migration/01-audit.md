# Phase 1 audit: current Astro site

Audited 2026-09-22 on branch `payload-migration` (from `main` @ `bd0e7bf`).

## What is live

- `https://www.nothingwrongwithyou.org` serves **this Astro build** from Cloudflare (response headers match `public/_headers`). `HANDOFF.md` still says "not deployed"; that is out of date.
- Git remote `origin` = `github.com/TheGalacticMonk/nothing-wrong-with-us`. Assume `main` auto-deploys to production. **Never push `main` during the migration.**
- Live contact form has **no Formspree ID** (`/contact` Send button is disabled in production).
- Indexed URLs (sitemap): `/`, `/about-me`, `/art`, `/collage-art`, `/contact`, `/music`, `/resources`, `/videos`. `/blog` returns 404 (blog hidden).
- Live redirects: `/new-page → /resources`, `/info-contact-carson → /contact`, `/cart → /` (301).

## Stack

Astro 7, TypeScript strict, Tailwind 4 (`@theme` tokens in `src/styles/global.css`, 451 lines), no client framework, ~0.3–1.5 KB inline JS per page. Fonts via Astro Fonts (Fontsource): Fraunces 300/400/700 + italics, Barlow Condensed 600/700. Static output, `build.format: 'file'`, `trailingSlash: 'never'`. Node 22.

## Page-by-page migration map

| Route | Astro source | Content today | Editable in CMS | Fixed in code |
| --- | --- | --- | --- | --- |
| `/` | `pages/index.astro` | Hero art + alt, eyebrow, tagline, 2 CTAs; manifesto (lead-in, 4 stanzas, closing line); story (portrait, pull quote, body, CTA); 3 "doors" with live counts; closing (heading, text, triad, CTA). All hardcoded. | Hero image, eyebrow, tagline, CTA labels; manifesto lines; story quote/body/portrait; closing heading/text | Layout, masks, door grid, counts (computed), star decorations |
| `/about-me` | `pages/about-me.astro` + `content/pages/about.md` | Intro header (hardcoded h1, lede, 4 chants, Instagram link), portrait, long body (Markdown) | Heading (two parts), lede, chants, portrait, body (rich text), SEO | Paper panel, sticky portrait, content note placement |
| `/art` | `pages/art.astro` | Heading + 3 cards with computed counts | Heading, description | Cards (derived from sections) |
| `/collage-art` | `pages/collage-art.astro` + `data/collage.json` + 22 webp | 22 images with alt, sorted by id; lightbox dialog | Add/remove/reorder pieces, alt text | Gallery grid (wide if ratio > 1.15, contain if > 2.2), viewer |
| `/music` | `pages/music.astro` + `data/songs.json` + 3 MP3 (22 MB) in `public/audio` | Intro line, 3 tracks (title, artist, duration, file), hardcoded order | Intro, songs (title, artist, audio file), order | Player layout |
| `/videos` | `pages/videos.astro` + `data/videos.json` + 3 posters | 3 YouTube videos, hardcoded order | Videos (title, description, YouTube link, poster), order | Privacy facade (nocookie, click-to-load) |
| `/resources` | `pages/resources.astro` + `content/pages/resources.md` | Long rich text (h2, lists, links, italics) | Body (rich text), SEO | Content note + crisis block |
| `/contact` | `pages/contact.astro` + `ContactForm.astro` | Header, About copy (3 paras, hardcoded), social list, Booking address, crisis block, Formspree form | Header text, About copy, address, form topics | Form behaviour, validation, honeypot |
| `/404` | `pages/404.astro` | Static | No | Yes |
| `/robots.txt` | `pages/robots.txt.ts` | Generated | No | Yes |
| `/sitemap-*.xml` | `@astrojs/sitemap` | Generated | No (automatic) | Yes |
| `/blog`, `/blog/[...path]` | `pages/_blog/*` (disabled) + 7 posts in `content/blog` | Hidden, returns 404 live. | **Out of scope (client decision 2026-09-22).** Not migrated; posts stay in the Astro source and git history. | — |

## Site-wide content (`src/config/site.ts`)

Site name, tagline, owner, default description, main nav (5 items + Art sub-sections), 6 social links (also used in `Person.sameAs` JSON-LD), featured video/podcast links, **safety copy** (content note, 988 + RAINN crisis lines, legal notice, quick-exit URL; flagged as pending client approval), Formspree ID (env).

## Components (14)

`BaseLayout`, `Header` (desktop nav + `<details>` mobile menu with animation, Social dropdown, Esc/click-away JS), `Footer`, `SEO` (title pattern, canonical, OG/Twitter, WebSite + Person JSON-LD on home), `PageHeader`, `ArtCard`, `ArtNav`, `ContactForm` (no-JS POST + JS validation/fetch), `ContentNote`, `CrisisResources`, `QuickExit` (unused, kept), `ShootingStars` (CSS only, reduced-motion aware), `Star`, `Wordmark`, `YouTubeFacade`.

## Rich-text features actually used

Headings (h2, one h4), paragraphs, bold, italic, bold-italic, links (incl. autolinks), bullet + numbered lists, blockquotes, horizontal rules. No inline images, tables or embeds. External links open in a new tab (custom Markdown plugin).

## Media

- 22 collage webp, 1 portrait webp, hero PNG (working copy in `src/assets/hero`, 17 MB original in `assets/`), 3 video posters, `public/og-default.jpg`, `public/favicon.svg`.
- 3 MP3s, 22 MB total.
- Astro generates responsive AVIF/WebP at build time. Per-image quality tuned (hero AVIF q36, collage q45/60).

## Measured baseline (from HANDOFF.md, local build)

Lighthouse mobile: A11y / Best Practices / SEO 100; Performance 96–100; LCP 1.5–2.3 s, `/collage-art` 2.8 s. This is the bar the Next.js build must meet.

## Migration risks found

1. **Production coupling:** `main` → live. Mitigation: branch only; new app deploys to a separate preview target.
2. **Static → server:** the site gains a runtime, a database and an admin login. New attack surface and ongoing cost where there was none.
3. **Image pipeline:** Astro's build-time optimisation must be replaced (Payload image sizes and/or Next image optimisation). Runtime support differs by host.
4. **Scoped CSS:** Astro `<style>` blocks must become CSS Modules without visual drift (`:global()` usages, child-root styling gotchas).
5. **Hardcoded copy:** home, about intro and contact copy is in templates, not content files. Must be lifted into fields verbatim.
6. **Unapproved safety copy** is live (content note, crisis lines, legal line). Keep as-is but make it editable/toggleable.
7. **Audio (22 MB) and hero original (17 MB)** should live in object storage, not the repo/bundle.
