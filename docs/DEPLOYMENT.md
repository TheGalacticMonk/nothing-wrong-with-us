# Deployment, backups and rollback

## Current preview (deployed 2026-09-22/23)

- **URL:** https://nwwy-cms.thegalacticmonks.workers.dev (`noindex`; canonical URLs point at production)
- **Admin:** `/admin`. There is one admin account (the site owner's email). Its generated password was handed over privately and is not in this repo. Add the client's editor account from Team → Add.
- **Resources:**
  - D1 `nwwy-cms` (`95011fee-…`) and `nwwy-next-tag-cache` (`f23fa13f-…`)
  - R2 `nwwy-media` (custom domain `https://media.nothingwrongwithyou.org`; the r2.dev URL is also still enabled and can be switched off) and `nwwy-next-cache`
  - Zone: Images → Transformations enabled for nothingwrongwithyou.org ("resize from any origin" off)
- **Build for this preview:** `MEDIA_PUBLIC_URL=https://media.nothingwrongwithyou.org NEXT_PUBLIC_IMAGE_TRANSFORMS=1 NEXT_PUBLIC_NOINDEX=1 NEXT_PUBLIC_SERVER_URL=<workers.dev url> pnpm exec opennextjs-cloudflare build`, then `opennextjs-cloudflare deploy -- --secrets-file <file with PAYLOAD_SECRET>`.

Target: **Cloudflare Workers (Paid) + D1 + R2**, built with OpenNext from Payload's `with-cloudflare-d1` template.

> Nothing here has been run against the Cloudflare account yet. Each step marked **(approval)** changes live infrastructure and needs the site owner's explicit go-ahead.

## What runs where

| Piece | Cloudflare resource | Name |
| --- | --- | --- |
| App (site + admin + API) | Worker | `nwwy-cms` (the live Astro site is the separate Worker `nothing-wrong-with-you`) |
| Content database | D1 | `nwwy-cms` (binding `D1`) |
| Uploaded files (images, collage, songs) | R2 | `nwwy-media` (binding `R2`) |
| Page/data cache | R2 | `nwwy-next-cache` (binding `NEXT_INC_CACHE_R2_BUCKET`) |
| Cache tags (instant publish) | D1 | `nwwy-next-tag-cache` (binding `NEXT_TAG_CACHE_D1`) |
| Image resizing | Cloudflare Images binding | `IMAGES` |

Estimated cost: Workers Paid $5/month. D1, R2 and the Images free tiers should cover this traffic. Image transformations beyond the monthly free allowance are billed per unique transformation; check the Images dashboard after the first month.

## Environment

| Variable | Where | Secret? |
| --- | --- | --- |
| `PAYLOAD_SECRET` | `wrangler secret put PAYLOAD_SECRET` | **Yes.** 32+ random bytes. Rotating it signs everyone out. |
| `NEXT_PUBLIC_SERVER_URL` | `vars` in `wrangler.jsonc` | No. The Worker's public URL, no trailing slash |
| `NEXT_PUBLIC_NOINDEX` | `vars`, set to `"1"` on preview deploys | No. Adds `noindex` to every page |
| `MEDIA_PUBLIC_URL` | `vars` **and** the build environment | No. Public origin of the `nwwy-media` bucket. When empty, images are served full-size by the Worker (slow). |
| `NEXT_PUBLIC_IMAGE_TRANSFORMS` | build environment | No. `1` resizes images with Cloudflare Image Transformations on the media domain (`src/lib/imageLoader.ts`). Needs the media custom domain and Transformations enabled on the zone; r2.dev does not support it |
| `PAYLOAD_REMOTE_BINDINGS` | shell only, never in `vars` | No. `1` makes Payload scripts use the real D1/R2 via the `remote` wrangler env |

- Nothing secret is ever prefixed `NEXT_PUBLIC_`.
- Database and bucket access uses bindings, not credentials, so there are no DB passwords anywhere.

## First deploy to a preview URL **(approval)**

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create nwwy-cms                 # copy database_id into wrangler.jsonc (D1)
pnpm exec wrangler d1 create nwwy-next-tag-cache      # copy database_id (NEXT_TAG_CACHE_D1)
pnpm exec wrangler r2 bucket create nwwy-media
pnpm exec wrangler r2 bucket create nwwy-next-cache
pnpm exec wrangler secret put PAYLOAD_SECRET          # paste `openssl rand -hex 32`
pnpm exec wrangler r2 bucket dev-url enable nwwy-media   # preview only: public r2.dev URL for uploads
# set MEDIA_PUBLIC_URL to that https://pub-….r2.dev URL (wrangler.jsonc vars + build env)
# copy both database_ids into BOTH the top-level bindings and env.remote in wrangler.jsonc
# set NEXT_PUBLIC_SERVER_URL (and NEXT_PUBLIC_NOINDEX="1") in wrangler.jsonc vars
pnpm run deploy                                       # runs migrations on remote D1, then builds + deploys the Worker
PAYLOAD_REMOTE_BINDINGS=1 SEED_CONFIRM=I_UNDERSTAND pnpm seed --allow-remote    # one-time content import into the empty remote DB
```

Then create the client's editor account in `/admin` (Team → Add), and run QA against the `workers.dev` URL:
`BASE_URL=https://nwwy-cms.<subdomain>.workers.dev pnpm test:e2e:readonly`, plus Lighthouse (mobile) on `/`, `/collage-art` and `/about-me`. **Release gate:** Performance ≥ 90 and LCP ≤ 2.5 s. This can only be measured here, because local runs serve full-size originals.

## Going live (cutover) **(approval)**

1. Freeze edits on the old site (it has no CMS, so nothing to freeze).
2. (Done 2026-09-23) The media bucket's domain and zone Transformations are already set up. Keep `MEDIA_PUBLIC_URL=https://media.nothingwrongwithyou.org` and `NEXT_PUBLIC_IMAGE_TRANSFORMS=1`. Optional: turn off the bucket's r2.dev URL.
3. In `wrangler.jsonc`, add a route or custom domain for `www.nothingwrongwithyou.org` (and the apex redirect), remove `NEXT_PUBLIC_NOINDEX`, and set `NEXT_PUBLIC_SERVER_URL=https://www.nothingwrongwithyou.org`.
4. Remove the custom domain from the old `nothing-wrong-with-you` Worker. Deploy. Check every URL in `docs/migration/03-content-migration.md`, then the redirects, `/sitemap.xml` and `/robots.txt`.
5. Leave the old Worker deployed but unrouted for 30 days.

## Rollback

- **Bad app deploy:** `pnpm exec wrangler rollback` (or Workers → Deployments → Rollback). This doesn't touch data.
- **Bad content edit:** the client restores a previous version in the admin (each page has version history).
- **Database damage:** D1 Time Travel restores to any minute in the last 30 days:
  `pnpm exec wrangler d1 time-travel restore nwwy-cms --timestamp=<ISO time>`.
  **(approval)** It overwrites the current DB.
- **Whole migration:** point the domain back at the `nothing-wrong-with-you` Worker. The Astro site is unchanged on `main`.

## Backups

| What | How | Retention |
| --- | --- | --- |
| Database | D1 Time Travel (automatic) | 30 days |
| Database (off-platform) | `pnpm exec wrangler d1 export nwwy-cms --remote --output=backups/nwwy-cms-$(date +%F).sql` weekly, kept outside Cloudflare | Keep 12 |
| Uploaded files | R2 has no automatic backups. Mirror `nwwy-media` monthly with `rclone sync` (R2 S3 API token, read-only) to a second location | Latest + monthly |
| Code | Git (`payload-migration` → `main` at cutover) | — |

Test a restore once before launch: import the latest export into a scratch D1 (`wrangler d1 execute scratch --file=…`) and open the admin against it.

## Schema changes

1. Change the collections/globals.
2. Run `pnpm payload migrate:create <name>` and commit the migration.
3. Run `pnpm run deploy`. It applies migrations to remote D1 before deploying the Worker.

Never edit an applied migration. Always keep the D1 adapter version pinned, because it is still in beta.

## Security checklist

- **Admin login:** no public sign-up, and only admins create users. After 5 failed attempts the account locks for 15 minutes. Session cookies are `Secure` and `SameSite=Lax` in production. The admin is `noindex`, and `/admin` and `/api` are disallowed in `robots.txt`.
- **Drafts:** unpublished pages and items are readable only by signed-in users. Preview mode requires a signed-in user.
- **Headers:** security headers are the same as the current site. The CSP ships as Report-Only; switch it to enforcing after a week with no reports.
- **Local never touches Cloudflare:** the top-level bindings in `wrangler.jsonc` are all local. Real D1/R2 are declared only in `env.remote`, which Payload uses only when `PAYLOAD_REMOTE_BINDINGS=1`. Never add `"remote": true` to the top-level bindings.
- **Framing:** `/admin` and `/api` send `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`.
- **Uploads are public:** files are served from a public bucket, so an unpublished collage image is reachable if someone knows its exact URL. Its page entry stays hidden.
- **Access:** give the client her own editor account, and give the developer a separate admin account. Don't share accounts.
