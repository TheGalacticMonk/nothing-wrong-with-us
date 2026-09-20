# Nothing Wrong With You

Static Astro site for [nothingwrongwithyou.org](https://www.nothingwrongwithyou.org/), rebuilt from Squarespace.
Astro 7 · TypeScript (strict) · Tailwind CSS 4 · no client framework. No external JS files; each page inlines 0.3–1.5 KB of script (gallery viewer, video facade, form validation).

## Commands

| Command            | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| `npm install`      | Install dependencies (Node ≥ 22.12; `.nvmrc` pins 22.19) |
| `npm run dev`      | Dev server on `localhost:4321`                           |
| `npm run build`    | Production build to `dist/`                              |
| `npm run preview`  | Serve `dist/` locally                                    |
| `npm run validate` | `astro check` + ESLint + Prettier check + build          |

## Project layout

```
src/
  config/site.ts        Site name, nav, social links, safety copy, contact fallback. Edit facts here.
  content/blog/*.md     Blog posts (frontmatter `path` keeps the old Squarespace URL)
  content/pages/*.md    About and Resources page text
  data/*.json           Collage images (+ alt text), songs, videos
  assets/               Images processed by Astro (hero, portrait, collage, video posters)
  components/           Header, Footer, ContactForm, YouTubeFacade, ...
  layouts/BaseLayout    Head, fonts, skip link, header/footer
  pages/                Routes (file-based)
  styles/global.css     Design tokens (@theme), prose, paper + wave edges, motion
public/
  audio/*.mp3           The three songs (served as-is)
  _redirects, _headers  Cloudflare redirects and security headers
scripts/migrate-blog.py One-off Squarespace -> Markdown converter (kept for reference)
```

### Common edits

- **Blog is hidden for now.** Routes live in `src/pages/_blog` (the underscore stops Astro building them); nav, Art page, home "Read" door and `_redirects` lines are commented out (search for "Blog hidden"). To restore: rename `_blog` to `blog` and uncomment those.
- **Add a blog post:** create `src/content/blog/<date>-<slug>.md` with `title`, `date`, `path` (the URL after `/blog/`), optional `excerpt`, `tags`.
- **Add a collage piece:** drop the image in `src/assets/collage/`, add an entry with descriptive `alt` text to `src/data/collage.json`.
- **Add a song:** put the MP3 in `public/audio/`, add an entry to `src/data/songs.json`.
- **Add a video:** save its poster to `src/assets/video/`, add an entry to `src/data/videos.json`.

## Contact form (Formspree)

The form posts to Formspree. Create a form at formspree.io (its notification address is where messages go), then set:

```
PUBLIC_FORMSPREE_ID=<the id after /f/ in the endpoint URL>
```

This is a public identifier, not a secret. Set it in Cloudflare (Settings → Variables and Secrets, as a **build** variable) or in a local `.env`. It is inlined at build time, so **rebuild after changing it**.
Until it is set, `/contact` still shows the form but the Send button is disabled with a note (the build logs a warning). No email address is published on the site. Spam protection: honeypot field plus Formspree's own filtering. The form works without JavaScript (plain POST) and is enhanced with inline validation when JS is available.

## Deploying to Cloudflare

The output is fully static, so no server runtime is needed.

**Cloudflare Pages:** connect the repo, build command `npm run build`, output directory `dist`, environment variables `NODE_VERSION=22.19.0` and `PUBLIC_FORMSPREE_ID`.

**Cloudflare Workers (static assets):** `npm run build && npx wrangler deploy` (config in `wrangler.jsonc`).

Both honour `public/_redirects` and `public/_headers`. Nothing here touches DNS. **Cut over the domain only after the client approves**, and keep the canonical host in sync in two places if it ever changes: `astro.config.mjs` (`SITE_URL`) and `src/config/site.ts` (`site.url`).

### URLs and redirects

Existing URLs are kept (`/about-me`, `/art`, `/collage-art`, `/blog/...`, `/music`, `/videos`). Three change and are permanently redirected:
`/new-page` → `/resources` · `/info-contact-carson` → `/contact` · `/cart` → `/` (the shop was empty). Blog tag pages redirect to `/blog`.

`_headers` ships a `Content-Security-Policy-Report-Only` header. Watch the browser console after launch, then switch it to an enforcing `Content-Security-Policy` once nothing is reported.

## Accessibility, performance, SEO (as measured)

Lighthouse (mobile, simulated slow 4G) against the production build: Accessibility, Best Practices and SEO were 100 on every page template. Performance 96–100; LCP 1.5–2.3 s on most pages, **2.8 s on `/collage-art`** (target 2.5 s). Desktop home: 100, LCP 0.5 s. Re-run after any content or image change.

Not tested: real-device screen readers (VoiceOver/NVDA), Safari/Firefox, and a live Formspree submission.

## Content notes for the client

- Text was migrated verbatim. Only edits: "the the magic" → "the magic" (About); "send me an email below" → "send me a message" (Contact); Resources headings tidied to sentence case; video titles written as words (`shadowwork`) instead of letter-spaced (`s h a d o w w o r k`) so screen readers can read them (the letter-spacing is preserved visually).
- Not migrated: blog header/body images (third-party celebrity and search-result images, rights unclear), blog comments, the Instagram embeds on About (replaced by a link), the old logo image.
- Collage alt text was written from the images; please review, and supply titles/dates if wanted.
- **Added, not in the original, needs client approval:** the Quick Exit button (currently removed from the header; `QuickExit.astro` is kept, re-add it in `Header.astro`), content notes, crisis-line block (988, RAINN) and the "not legal advice" footer line. All are defined in `src/config/site.ts` (`safety`) and used by `ContentNote`, `CrisisResources`, `Footer`, `QuickExit`.
- The hero artwork has no credit line yet. Add the artist's name once confirmed.

# nothing-wrong-with-us
