# Nothing Wrong With You

Website and CMS for [nothingwrongwithyou.org](https://www.nothingwrongwithyou.org).

- **Stack:** Next.js 16 (App Router) with Payload CMS 3, on Cloudflare Workers via OpenNext.
- **Storage:** D1 for content, R2 for uploads.
- **Origin:** migrated from the Astro site that is preserved in `legacy/astro/`.

| Doc | For |
| --- | --- |
| [docs/CLIENT-GUIDE.md](docs/CLIENT-GUIDE.md) | The client: editing, images, preview, publishing |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy, environment, backups, rollback, security |
| [docs/migration/](docs/migration/) | Audit, architecture decisions, content migration inventory |
| [docs/QA-REPORT.md](docs/QA-REPORT.md) | Latest release verification |

## Local development

Requires Node ≥ 22.12 and pnpm.

```sh
pnpm install
cp .env.example .env          # set PAYLOAD_SECRET (openssl rand -hex 32) and the SEED_* accounts
pnpm payload migrate          # create the local D1 schema (wrangler emulation in .wrangler/)
pnpm seed                     # import the site's content + create local admin/editor accounts
pnpm verify:content           # check the import against legacy/astro
node_modules/.bin/next dev    # http://localhost:3000, admin at /admin
```

- **Start the dev server with the binary directly, not `pnpm dev`.** Under pnpm 12, `pnpm dev` has emptied `node_modules`.
- **Test on the real Workers runtime** with `pnpm preview:local`. It runs the OpenNext build, then `wrangler dev --local` on port 8787.

**Nothing local touches Cloudflare.** Remote D1/R2 is used only when `PAYLOAD_REMOTE_BINDINGS=1` is set. That happens in `pnpm run deploy:database`, and in a remote seed, which also requires `--allow-remote` and `SEED_CONFIRM=I_UNDERSTAND`.

## How it fits together

```
src/
  payload.config.ts      D1 adapter, R2 storage, admin config, collections/globals
  collections/           Collage, Songs, Videos (orderable, drafts), Media, Users (admin/editor)
  globals/               Home, About, Art, Resources, Contact (drafts + Live Preview), SiteSettings
  fields/                Shared fields: restricted Lexical editor, SEO group, alt text, page buttons
  access/                Role and draft-visibility rules
  hooks/revalidate.ts    Publish → revalidateTag(…, { expire: 0 }) so the site updates immediately
  admin/                 Branded logo/icon, task dashboard, plain-language translations
  lib/content.ts         The only way the frontend reads CMS data (cached + tagged; drafts in preview)
  lib/paths.ts           Which URL each page global renders (preview, revalidation, sitemap)
  app/(frontend)/        Public pages (server components) + CSS Modules
  app/(payload)/         Payload admin and REST API
  app/next/preview       Draft-mode entry (requires a logged-in user)
  components/            Ported Astro components
scripts/                 seed.ts, verify-content.ts (idempotent, guarded)
legacy/astro/            The original Astro site, untouched
```

**Content model.** Each page has a fixed layout, so each page is a global with dedicated fields; there is no page builder. The art lists are orderable collections. Site-wide text lives in Site Settings. This includes the support messages, each with an on/off switch, and the Formspree ID.

**Caching.** Frontend routes render on demand. Their data comes through `unstable_cache`, tagged `global:<slug>` / `collection:<slug>` and always `collection:media`. On Workers the cache is OpenNext's R2 incremental cache plus the D1 tag cache (`open-next.config.ts`). Publishing expires the tags.

**Images.**
- Workers has no sharp, so Payload stores originals only: no crop, focal point or generated sizes.
- In production, uploads are linked from the R2 public hostname (`MEDIA_PUBLIC_URL`) and resized on delivery through the Cloudflare Images binding.
- Files served by Payload itself (`/api/*/file/*`) are shown unoptimised. This covers local development and any setup without `MEDIA_PUBLIC_URL`.

## Common changes

- **Add a field:**
  1. Edit the collection/global.
  2. Run `pnpm payload generate:types`.
  3. Run `pnpm payload migrate:create <name>`.
  4. Commit the migration.
  5. Use the field in the page.
- **Add a page:**
  1. Create a global via `pageGlobal()` in `src/globals/`.
  2. Add its path to `src/lib/paths.ts` and register it in `payload.config.ts`.
  3. Add the route under `app/(frontend)/`, the sitemap entry and a dashboard card in `src/admin/Welcome.tsx`.
- **Admin wording:** use field `label`/`admin.description`, or `src/admin/translations.ts` for Payload's own UI text.

## Checks

```sh
pnpm exec tsc --noEmit
pnpm lint
NODE_ENV=production pnpm build
pnpm verify:content
pnpm test            # integration + Playwright (see tests/)
```
