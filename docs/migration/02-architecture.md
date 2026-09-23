# Phase 2: architecture and content model (proposal)

Status: **approved 2026-09-22.** Decisions:

1. **Hosting: all Cloudflare** (Workers Paid + D1 + R2), built from Payload's official `with-cloudflare-d1` template. This overrides the Option B recommendation below; its risks are accepted and mitigated as listed under "Cloudflare-specific mitigations".
2. **Safety copy:** keep exactly as live, editable, with an on/off switch per item in Site Settings.
3. **Contact:** keep Formspree; the form ID is a Site Settings field.
4. **Blog:** out of scope.

## Stack

- **Next.js 16.3.3+** (App Router, React Server Components, TypeScript strict). This is the only range both Payload 3.90 (`>=16.3.3 <17`) and the OpenNext Cloudflare adapter accept, so the choice stays open between hosts.
- **Payload 3.90.x** (latest stable, 2026-09-18), in the same Next app: the admin is at `/admin` and the frontend in `app/(frontend)`.
- **Tailwind 4:** keep `global.css` and its `@theme` tokens as-is.
- **Component styles:** each Astro scoped `<style>` block becomes a CSS Module, copied close to verbatim so the look doesn't drift.
- **Fonts:** `next/font/google` (Fraunces, Barlow Condensed), self-hosted at build time.
- **Client JS:** only the existing behaviours: menu, lightbox, YouTube facade, form validation. No new UI libraries.
- **Lexical** rich text, restricted to the features the content uses:
  - paragraph, H2, H3
  - bold, italic
  - link (external links open in a new tab)
  - bullet and numbered lists, quote, divider

## Content model

The site has fixed layouts, so each page is a **Global with dedicated fields**. There is no page builder. The per-page globals appear in the admin under a **Pages** group.

| Admin section | Type | Contents |
| --- | --- | --- |
| **Pages → Home** | Global (drafts) | Hero image + alt, eyebrow, tagline, 2 buttons; manifesto lines; story portrait, quote, text; closing heading, text, button; SEO |
| **Pages → About** | Global (drafts) | Heading (plain + emphasised part), lede, affirmations list, portrait, body (rich text), SEO |
| **Pages → Art** | Global | Heading, description |
| **Pages → Collage / Songs / Videos** | Globals | Page heading, intro, SEO. The items themselves live in the collections below |
| **Pages → Resources** | Global (drafts) | Body (rich text), SEO |
| **Pages → Contact** | Global (drafts) | Heading, lede, About text, address, form topics, SEO |
| **Collage** | Collection (drafts, drag-to-reorder) | Image, description for screen readers (required), optional title and year |
| **Songs** | Collection (drag-to-reorder) | Title, artist, audio file, duration (auto-read from the file where possible, otherwise typed) |
| **Videos** | Collection (drag-to-reorder) | Title, description, YouTube link (the ID is parsed from it), cover image (optional, falls back to YouTube's thumbnail) |
| **Media** | Upload collection | Images (alt required) and audio, stored in R2 |
| **Site Settings** | Global | Site name, tagline, default description, social links, featured video/podcast links, safety messages (each with an on/off switch), Formspree ID |
| **Users** | Collection | Hidden from the Editor role |

- **Navigation has no admin section.** The routes are fixed. Social links live in Site Settings.
- **Blog:** out of scope.
- **Roles:**
  - `admin` (developer): everything.
  - `editor` (client): content only, and cannot see Users or technical fields.

## Admin experience (the "Ghost-like" layer)

- **Dashboard:** a custom `beforeDashboard` panel shows large cards ("Edit Home page", "Add a collage piece", "Add a song", …), a "View site" link and the last edits. The default collection grid is hidden for editors.
- **Plain language:**
  - Labels such as "Description for screen readers" instead of "alt", and "Search result preview" instead of "SEO".
  - Help text on every field.
  - No slugs, IDs or JSON are shown.
- **Publishing:**
  - Drafts with autosave.
  - One **Publish** button.
  - **Live Preview** in a side pane at desktop and phone widths.
  - Version history for rollback.
- **Branding:** the admin carries the site's logo, colours and fonts, and the login page is branded.
- **Instant updates:** publishing calls `revalidatePath`/`revalidateTag` from `afterChange` hooks, so the live site updates within seconds with no rebuild.

## Rendering and SEO

- **Rendering:** pages are statically generated and revalidated on demand. Draft Mode handles previews.
- **Metadata:** `generateMetadata` reproduces the current title pattern, canonical URLs (www, no trailing slash), OG/Twitter tags and JSON-LD (WebSite + Person).
- **Crawl files and redirects:**
  - `app/sitemap.ts` covers the same 8 URLs.
  - `app/robots.ts` also disallows `/admin`.
  - The existing 301s move to `next.config` `redirects()`.
- **Security headers:** the current `_headers` are kept. The CSP is widened only for the admin and preview.

## Hosting (researched against official docs, 2026-09-22)

| | A. Cloudflare Workers + D1 + R2 | B. Vercel Pro + Neon Postgres + R2, DNS stays on Cloudflare |
| --- | --- | --- |
| Official Payload support | Yes, via the `with-cloudflare-d1` template; **the D1 adapter is beta** | Yes; stable adapters only |
| Image processing | **No sharp on Workers:** no crop, focal point or resized versions. Needs pre-sized uploads or Cloudflare image transformations | Full (sharp + Next image optimisation) |
| Scheduled publish, Live Preview | Unverified on Workers | Supported |
| On-demand revalidation | Needs OpenNext R2 + D1 cache setup | Built in |
| Backups | D1 Time Travel, 30 days | Neon PITR (Launch plan, 7 days) or a nightly `pg_dump` to R2 |
| Cost | **About $5/mo** | **About $20–25/mo** (Hobby is not allowed for a paid build) |

**Recommendation: B.**
- The client uploads photos herself and the site is image-led. Option A has no image processing and runs on a beta database adapter, so it puts the most risk on the part she touches most.
- B keeps Cloudflare for DNS and media and uses stable, fully supported pieces.
- A is viable if the lowest cost matters most. It can be revisited when the D1 adapter goes stable, because the frontend code is the same either way.

## Cloudflare-specific mitigations

- **No sharp:** Payload stores originals only (`crop:false`, `focalPoint:false`, no `imageSizes`). Responsive images come from a custom `next/image` loader using Cloudflare Image Transformations (`/cdn-cgi/image/...`) on the zone. Seeded images are the already-optimised webp files. The admin warns about very large uploads.
- **D1 adapter in beta:** pin exact versions; migrations are committed and run explicitly; D1 Time Travel (30 days) plus a scheduled `wrangler d1 export` to R2.
- **Revalidation:** OpenNext R2 incremental cache + D1 tag cache, configured from the start and tested end-to-end.
- **Scheduled publish:** not in scope for v1 (unverified on Workers). Publish is immediate.
- **Live Preview:** built and tested locally under `wrangler`/OpenNext preview. If it fails on Workers, fall back to the "Preview" button (draft-mode link).
- **REST/Local API only;** GraphQL disabled.

## Migration risks

1. **Production coupling:** `main` deploys the live site. All work stays on `payload-migration`, and the new app deploys to a separate preview project. DNS cutover happens only with approval.
2. **Payload 4 is in canary.** Pin 3.90.x and plan an upgrade later.
3. **Visual parity.** Risk points are the scoped CSS → CSS Modules port and image quality/format changes. QA will compare screenshots against the live site at 390 px and 1440 px.
4. **Performance regression:** it comes from the runtime and image pipeline. The bar is Lighthouse ≥ 95 and LCP ≤ 2.5 s.
5. **Admin exposure:** a new login surface. Mitigations are rate-limited login, strong passwords, no public user sign-up, and `/admin` excluded from indexing.

## Team and execution plan

This session has Claude Code **subagents**, not a persistent native agent team. Agents run as background subagents. Each owns separate directories, and integration goes through the Technical Director.

| # | Agent | Owns | Starts after |
| --- | --- | --- | --- |
| 1 | Technical Director (me) | Scaffold, `payload.config.ts`, shared types, integration, commits | Approval |
| 2 | Payload engineer + CMS UX | `src/collections`, `src/globals`, `src/access`, `src/admin/*`, Lexical config | Scaffold + slugs frozen |
| 3 | Frontend engineer | `src/app/(frontend)`, `src/components`, CSS Modules | Scaffold (builds against typed fixtures, then wires to Payload) |
| 4 | Migration + SEO | `scripts/seed.ts` (idempotent, upserts by key), sitemap/robots/redirects/metadata | Collections merged |
| 5 | DevOps + security | Env vars, deploy config, backups, headers, deploy runbook | Hosting decision |
| 6 | QA + accessibility | Playwright e2e (public pages + editor journey), axe, Lighthouse, visual diff against live | Integration |

Deliverables: this plan, the app, the seeded CMS, tests, `docs/DEVELOPER.md`, `docs/CLIENT-GUIDE.md` (plain language).
