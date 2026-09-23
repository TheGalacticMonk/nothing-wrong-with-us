# Deployment, backups and rollback

## Current preview (deployed 2026-09-23)

- **URL:** https://preview.nothingwrongwithyou.org (custom domain on the real zone; `noindex`, canonical URLs still point at production)
- **Why a real-zone hostname:** Cloudflare Image Transformations can resize an image on the page's own host (`/cdn-cgi/image/...`) only when that host is on the zone. On `workers.dev` the browser had to open a second connection to `media.nothingwrongwithyou.org` for every image, which cost real latency on 4G. Same-origin transforms removed that connection.
- **DNS:** `preview` is a Worker route (`wrangler.jsonc` → `routes`), separate from `www`/`nothingwrongwithyou.org`, which still point at the live Astro Worker untouched. Remove the route (Workers & Pages → nwwy-cms → Domains & Routes) to take the preview down.
- **workers.dev URL:** disabled by Cloudflare once a custom domain/route was added (its own platform behaviour, not something the app does). Nobody had it bookmarked.
- Superseded preview (kept for the history below): https://nwwy-cms.thegalacticmonks.workers.dev

- **URL:** https://nwwy-cms.thegalacticmonks.workers.dev (`noindex`; canonical URLs point at production)
- **Admin:** `/admin`. There is one admin account (the site owner's email). Its generated password was handed over privately and is not in this repo. Add the client's editor account from Team → Add.
- **Resources:**
  - D1 `nwwy-cms` (`95011fee-…`) and `nwwy-next-tag-cache` (`f23fa13f-…`)
  - R2 `nwwy-media` (custom domain `https://media.nothingwrongwithyou.org`; the r2.dev URL is also still enabled and can be switched off) and `nwwy-next-cache`
  - Zone: Images → Transformations enabled for nothingwrongwithyou.org ("resize from any origin" off)
- **Build for this preview:**
  ```sh
  MEDIA_PUBLIC_URL=https://media.nothingwrongwithyou.org \
  NEXT_PUBLIC_IMAGE_TRANSFORMS=1 \
  NEXT_PUBLIC_IMAGE_SAME_ORIGIN=1 \
  NEXT_PUBLIC_NOINDEX=1 \
  NEXT_PUBLIC_SERVER_URL=https://preview.nothingwrongwithyou.org \
  CANONICAL_HOST=preview.nothingwrongwithyou.org \
  pnpm exec opennextjs-cloudflare build
  pnpm exec opennextjs-cloudflare deploy -- --secrets-file <file with PAYLOAD_SECRET>
  ```
  **Delete `.next/` and `.open-next/` first if only env vars changed** — the webpack cache has shipped a stale build at least once (see the password-hashing note below).

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
- **Password hashing (patched):**
  - **Why:** Cloudflare Workers refuses PBKDF2 above 100,000 iterations in production, and Payload 3.90 hashes with 600,000. Logins and account creation fail on the deployed Worker, with the error hidden as "incorrect password". The cap does **not** exist in `next dev` or `wrangler dev`, so local tests cannot catch it.
  - **The patch:** `patches/payload@3.90.1.patch` (applied by pnpm) hashes new passwords with 100,000 iterations under the `pbkdf2-sha256-100k-v1:` prefix. Older 600k hashes still verify in Node and are upgraded on login.
  - **Trade-off:** this is below OWASP's 600k recommendation. It is mitigated by lockout after 5 attempts and strong passwords.
  - **Upgrading Payload:** re-check this before upgrading. The patch is pinned to 3.90.1, and `pnpm install` fails loudly if it no longer applies. Test a login on a deployed preview after any upgrade.
  - **Test:** `tests/int/password-hash.int.spec.ts`.
- **After changing a dependency patch,** delete `.next/` and `.open-next/` before building. The webpack cache kept the unpatched code once.
- **Local never touches Cloudflare:** the top-level bindings in `wrangler.jsonc` are all local. Real D1/R2 are declared only in `env.remote`, which Payload uses only when `PAYLOAD_REMOTE_BINDINGS=1`. Never add `"remote": true` to the top-level bindings.
- **Framing:** `/admin` and `/api` send `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`.
- **Uploads are public:** files are served from a public bucket, so an unpublished collage image is reachable if someone knows its exact URL. Its page entry stays hidden.
- **Access:** give the client her own editor account, and give the developer a separate admin account. Don't share accounts.

## Launch (completed 2026-09-23)

**www.nothingwrongwithyou.org and nothingwrongwithyou.org now serve the Next.js + Payload site.** The old Astro site's Worker (`nothing-wrong-with-you`) has no domains attached; it is left deployed, unrouted, as the rollback path (see Rollback, above) for 30 days from launch.

- Domains were moved via the Cloudflare dashboard (Workers & Pages → Domains & Routes), not automated — this repo's own safety tooling declined to run the cross-Worker domain move unattended, and that was the right call for an action this consequential. The site owner did it directly.
- `preview.nothingwrongwithyou.org` was removed as part of this (see the critical bug below) and its DNS record was cleaned up automatically by Cloudflare when the custom domain was detached.

### Critical bug found and fixed during launch: noindex leaked to production

**What happened:** immediately after the domain move, the live production site was sending `<meta name="robots" content="noindex">` on every page — the same directive intentionally used to keep the preview deploy out of search engines.

**Root cause:** `wrangler.jsonc`'s `vars` block had `NEXT_PUBLIC_NOINDEX: "1"` left over from the preview setup. Contrary to the usual assumption that `NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle at `next build` time and fixed from then on, **OpenNext's Cloudflare adapter provides `wrangler.jsonc` `vars` to server-rendered code via a live `process.env` at request time.** Building with the variable unset in the shell was not enough — the value declared in `wrangler.jsonc` overrode it at runtime, on every request, regardless of what the build was told.

**Fix:** `wrangler.jsonc`'s `vars` now hold the correct values for whatever is actually deployed (removed `NEXT_PUBLIC_NOINDEX` entirely for production; corrected `NEXT_PUBLIC_SERVER_URL`). A comment in the file now records this behaviour so it isn't rediscovered the hard way again. No code changes were needed — only the deployed configuration.

**Detected and fixed within minutes** by verifying the live `robots` meta tag directly after the domain move, before declaring launch complete, rather than assuming the earlier preview testing still applied once the same build was serving a different hostname.

**Also fixed just before this, during pre-launch verification on `preview.nothingwrongwithyou.org`:** the host-redirect rule (`/:path*` → the canonical host) produced a broken destination for the bare root path (`/`), leaving the literal, unsubstituted token `/:path*` in the `Location` header instead of `/`. This would have sent every visitor to the bare apex domain (a very common way people type a URL) to a broken link. Fixed by splitting the rule into an exact `/` case and a `/:path+` (one-or-more) case, which avoids the zero-segment match. See commit `b7b10e7`.

### Post-launch verification (2026-09-23)

- All 8 public routes: 200. Unknown paths: 404.
- Apex domain redirects to `www` (root path and sub-paths both correct).
- `noindex` absent; canonical URLs correct; `robots.txt` and `sitemap.xml` (8 URLs) correct.
- Admin reachable; Formspree-connected contact form confirmed; images serving via same-origin Cloudflare Image Transformations.
- All three legacy redirects (`/new-page`, `/info-contact-carson`, `/cart`) and the `/audio/*` → Songs collection redirect working.
- Automated suite against production: 53 passed, 1 skipped (admin-login tests, need local-only test credentials), 3 known/accepted differences (home canonical's trailing slash; R2 custom domain's missing `Accept-Ranges` header — seeking still works via 206 responses).

## Performance follow-up: investigated, not pursued (2026-09-23)

After launch, the site measures 88–98 (Lighthouse mobile) across all pages — accessibility 100 everywhere. Real, ground-truth server timing (via `wrangler tail`, not client-side measurement) shows most requests are genuinely fast (110–230ms server time). The remaining variance is occasional spikes (~600–700ms) on individual requests.

**Root cause, confirmed from live data (not guessed):** the spike's CPU time is nearly equal to its wall time (e.g. 616ms CPU of 686ms wall) — the Worker was actively computing that whole time, not waiting on the database. This is the signature of a Cloudflare Worker **cold start**: a fresh isolate loading and evaluating its JavaScript bundle. The D1/Payload data layer (`unstable_cache` + tags in `src/lib/content.ts`) is confirmed working correctly and is not the bottleneck.

**Considered and explicitly rejected:** converting the frontend to Next.js 16's "Cache Components" (`cacheComponents` / `'use cache'`) to cache full rendered pages, so a cache hit skips the render pipeline. Investigated and not pursued because:
1. **The feature has a documented bug history specifically in the interaction this app depends on for security** — whether `'use cache'` reliably bypasses the cache when Draft Mode is enabled (see [vercel/next.js#76581](https://github.com/vercel/next.js/issues/76581), opened against Next 15.2.0; a fix PR was merged but the exact scope/version coverage wasn't confirmed). Given drafts must never be servable to an anonymous visitor, this is not a risk to take on a live site without much more extensive verification than was practical to complete same-day.
2. **It likely would not have fixed the actual problem.** Traced OpenNext's Cloudflare R2 incremental cache implementation directly (`node_modules/@opennextjs/cloudflare/dist/api/overrides/incremental-cache/r2-incremental-cache.js`): a cache "hit" still requires the Worker to fully cold-start and load its JS bundle before it can even check the cache. Since the measured spikes are bundle-load/cold-start cost, not render or data-fetch cost, this mechanism would likely have skipped the wrong part of the request.

**A more promising, lower-risk direction for a future pass, not investigated further:** reduce what's actually loaded into the cold-start bundle. The public frontend and the Payload admin (rich text editor, admin UI, etc.) currently deploy as one combined Worker; a leaner bundle for public pages specifically (e.g. via OpenNext's documented multi-worker support, or trimming what's pulled into the frontend route bundle) would attack the cold-start cost directly, without touching the draft/publish/security logic at all. This was not implemented or verified — it's a starting point for investigation, not a confirmed fix.

**Decision: performance work stops here.** The site is already well above its accessibility/best-practices bar and materially faster than before the image-transforms work; the remaining gap is not worth the security-adjacent risk of the rejected approach.

## Bug fix: Live Preview stuck on a blank/loading panel (2026-09-23)

**Report:** the client tried the admin and found the Live Preview panel inside the page editor never loaded (looked like it was perpetually loading), though opening the same preview in its own browser tab/window worked fine.

**Diagnosis:** reproduced directly in the browser (with a temporary, since-deleted debug account) rather than guessed at from the code. No error appeared anywhere — not in the browser console, not in the Worker's server logs (checked both). Direct DOM inspection found the cause: the Live Preview `<iframe>`'s `src` was `http://www.nothingwrongwithyou.org/next/preview?...` — plain HTTP — while the admin page itself is `https://`. Browsers silently refuse to load an insecure iframe inside a secure page ("mixed content"), which is exactly a stuck/blank/"trying to load" panel with no console error. Opening the same URL directly in a new tab works because a top-level navigation to `http://` still gets redirected/upgraded normally; it's specifically the iframe-embedding case that's blocked.

**Root cause:** `src/lib/livePreview.ts` built the preview URL from Payload's `req.origin`, which on this Cloudflare Workers deployment reports the scheme as `http` even though the request arrived over `https` (Cloudflare terminates TLS at the edge; something between the Worker and Payload's request reconstruction isn't preserving it). `req.host` (hostname only, no scheme) was reliable.

**Fix:** derive the origin from `req.host` and set the scheme explicitly — `https` always, except for local dev (`localhost`/`127.0.0.1`). No longer trusts `req.origin`'s scheme at all. See `src/lib/livePreview.ts`.

**Verified directly in the browser after deploying the fix:** the preview iframe's `src` is now `https://...`, the page renders inside the panel, and typing in a field updates the preview live (tested end-to-end, then reverted the test edit and confirmed the live public site was unaffected throughout).

## Live Preview speed fix (2026-09-23)

**Report:** editing a field took a few seconds to show up in the preview panel — reproduced and timed directly (~2 seconds), root cause traced to `RefreshRouteOnSave`: it only fires after the full autosave round trip (800ms debounce, `versions.drafts.autosave.interval` on every page global) completes, then does a full `router.refresh()` — a brand-new server request that always re-renders from scratch, since draft-mode reads deliberately bypass all caching.

**Fix:** switched to `useLivePreview` (page globals) and a custom `useLivePreviewCollection` hook (Collage/Songs/Videos gallery pages, since `useLivePreview` only tracks one document by id and doesn't fit a list). Both listen for Payload's `postMessage` sent on every field change and merge the update client-side — no save, no round trip. `RefreshRouteOnSave` was removed entirely rather than kept as a fallback: read `@payloadcms/ui`'s source directly and confirmed it never covered anything the new hooks don't already cover in this app, and keeping it would cause a visible flash (a full page re-render on top of an already-current DOM) after every autosave.

**Scope:** frontend-only (`src/app/(frontend)/**`, `src/components/Preview/**`). Did not touch `src/lib/content.ts`, the draft/access logic, or anything server-side that decides what's shown to anonymous visitors — this is purely a faster way to sync data that was already fetched and already scoped correctly.

**A real bug found during implementation:** the hooks' one-time "ready" handshake throws if fired before the browser's own origin is known (a `useSyncExternalStore` resolves after mount), and the underlying library only tracks "already sent" — so a failed first attempt permanently means the admin never starts syncing at all. Fixed by deferring the hook's mount until the real origin is available.

**Verified locally** (isolated worktree, zero Cloudflare access throughout): full e2e suite on both `next dev` and the real Workers runtime (`wrangler dev --local`) — zero new failures beyond already-documented, accepted differences; text-field sync 88–95ms, image-swap sync 282ms (both well under the old 800ms debounce, confirmed to be genuinely bypassing it rather than just being a faster version of the save-triggered mechanism); Lighthouse mobile unchanged from the documented baseline (91/90/96 across representative pages, 100 accessibility everywhere); confirmed via `curl` that no live-preview client code is referenced in a normal (non-draft) page's HTML, so regular visitors' bundle is unaffected.

**Verified live in the browser on the actual production site after deploying:** edited a field and watched the preview update in essentially one round trip (no multi-second wait needed, vs. the ~2 seconds measured before the fix); confirmed the public site's 8 routes, content, and full read-only e2e suite are unaffected (same 3 already-accepted differences as every prior run, no new failures).

**Known, pre-existing limitation, unrelated to this fix:** reordering Collage/Songs/Videos happens in the collection's list view, which never had a live-preview iframe at all (checked directly: zero iframes present there, in both the old and new mechanism) — reordering was never something visible in a preview panel, and still isn't. Making that live would need a Payload-level change to the list view itself, out of scope here.
