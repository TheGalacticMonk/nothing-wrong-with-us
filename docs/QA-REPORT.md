# QA & accessibility report: Astro → Next.js 16.3.3 + Payload 3.90.1 on Cloudflare Workers

- **Branch:** `payload-migration`
- **Commit tested:** `a9953a0`, plus the uncommitted test files described below
- **Date:** 2026-09-22
- **Tester:** QA & Accessibility release engineer (independent verification)
- **Legacy baseline:** `legacy/astro` preview on `http://localhost:4321`

## Verdict: **NOT READY**

The public site matches the legacy site almost everywhere:

- Every public route has zero axe violations of any impact, at 390 px and 1440 px.
- Content, SEO, JSON-LD and nav states match. The heading outline, landmarks, links and alt text match everywhere except the two items below: the home canonical and the old audio URLs.
- Pages are pixel-identical to within 0.42%, except the collage page, where only the image re-encoding differs.
- Drafts never leak.
- Roles and anonymous-write protection hold.
- The editor journey works end to end in the Workers runtime. A Publish reaches the public page in under 0.1 s.

Five things block a release:

1. **Critical (safety):** `pnpm preview:local` is **not** local-only. It opened a remote Cloudflare connection on this machine (D1-1).
2. **The committed Workers configuration cannot serve media.** The media hostname has no DNS record, and nothing in the runbook creates it. Every image and song is broken in the Workers runtime (D1-3).
3. **The admin can be framed by any website** (clickjacking) (D1-5).
4. **"Unpublish" on a page leaves the live site stale.** Once the cache next refills, the page renders blank (D1-6).
5. **The performance target is unverified.** The only measurable Workers path serves full-size originals (Lighthouse Performance 74–78, LCP 6–20 s). The production image path (Cloudflare Images plus the R2 custom domain) can only be measured on a real preview deploy.

A green `pnpm build` is not approval: the build passes, and all five problems above remain.

### Defect counts

| Severity | Count |
| --- | --- |
| Critical | 1 |
| Major | 5 |
| Minor | 10 |
| Cosmetic | 3 |

Separately, there are **10 CMS usability issues** and **5 client-guide mismatches** (see the last two sections).

---

## Environments actually tested

| Env | How it was run | Status |
| --- | --- | --- |
| **A**: `next dev` | `node_modules/.bin/next dev -p 3000` | Ran. The full suite was executed. |
| **B (as committed)**: `pnpm preview:local` | OpenNext build, then `opennextjs-cloudflare preview -- --local --port 8787` | **Could not run safely.** It printed `⎔ Establishing remote connection...` and was killed within seconds (D1-1). Even if it had got further, it would fail on the compatibility date (D1-2). |
| **B1**: workerd, committed config (minus the two blockers) | `wrangler dev --local`, using a QA-only copy of `wrangler.jsonc` at `test-results/qa/wrangler.qa-local.jsonc`. Differences from the repo config: no `"remote": true` (fixes D1-1), and `compatibility_date` set to `2026-08-06` (fixes D1-2). Guards: `CLOUDFLARE_API_TOKEN` was set to an invalid value and `CLOUDFLARE_ACCOUNT_ID` to zeros, so any remote attempt would fail authentication. No remote connection occurred. | Ran. **All media is broken** (D1-3). |
| **B2**: workerd, as B1 but with `MEDIA_PUBLIC_URL=""` | Uploads are served by Payload from local R2 (`/api/<collection>/file/…`). | Ran. **The full suite was executed here.** |

Notes on B1/B2:

- I built the OpenNext tag-cache table myself with `wrangler d1 execute NEXT_TAG_CACHE_D1 --local`, which is the same SQL OpenNext's `populateCache` runs.
- The R2 incremental-cache populate step was skipped. It only covers the prerendered `robots.txt`, `sitemap.xml` and `_not-found`, and both files were served correctly.

---

## Results by area

| # | Area | Env A (next dev) | Env B2 (workerd) | Result |
| --- | --- | --- | --- | --- |
| 1 | Routes, status codes, 404, redirects (301 ×3), `/blog` 404, sitemap (8 canonical URLs), robots | ✅ | ✅ | Pass |
| 1 | Parity vs legacy (16 route/width runs): title, meta/OG/Twitter, canonical, JSON-LD, headings, landmarks, links (href/target/rel), image alts, `aria-current`, all visible text in `<main>` | 12/16 identical | 12/16 identical | **2 deviations:** home canonical/`og:url` (D2-2) and old audio URLs (D2-6) |
| 2 | Visual regression, 8 routes × 390/1440 (pixelmatch, threshold 0.1) | 14/16 under 1% | Same numbers | `/collage-art` is 1.09% / 2.63%: image re-encoding only, layout identical (D3-1) |
| 3 | Mobile menu (open, Esc with focus return, click-away, nested Social) | ✅ | ✅ | Pass |
| 3 | Desktop Social dropdown (keyboard, Esc with focus return, click-away) | ✅ | ✅ | Pass |
| 3 | Collage lightbox (Enter opens, ←/→ wrap around, Esc, focus returns to the thumbnail, Close, backdrop) | ✅ | ✅ | Pass. Tab can leave the modal for the browser UI; the legacy site behaves the same (native `<dialog>`). |
| 3 | YouTube facade: zero requests to YouTube or ytimg before the click; `youtube-nocookie` iframe after, and it receives focus | ✅ | ✅ | Pass |
| 3 | Audio playback and seek to 120 s in Chromium | ✅ | ✅ | Pass |
| 3 | Audio Range → 206 | ❌ The whole file is sent with a 206 status (D2-5) | ✅ 206, exactly 1000 bytes (chunked, no Content-Length) | Dev-only defect. HEAD returns 404 in both (D2-4). |
| 3 | Contact form, no Formspree ID: form shown, Send disabled | ✅ | ✅ | Pass |
| 3 | Contact form, fake ID `qaFake1234` set in Site Settings then restored. Every formspree.io request was intercepted; nothing was sent. | ✅ | ✅ | Pass. The ID takes effect immediately. Checked: validation messages, `aria-invalid`/`aria-describedby`, focus moves to the first error, the 200 success state (focus moves to the status message and the form resets), the 500 failure state (message kept), and a network failure. |
| 3 | Reduced motion (no running animations when `reduce`) | ✅ | ✅ | Pass |
| 4 | axe-core (WCAG 2.0/2.1/2.2 A/AA plus best practices): 8 routes and the 404 page at 390 and 1440, plus the open menu, the Social dropdown and the collage viewer | ✅ 0 violations of any impact | ✅ 0 | Pass |
| 4 | Keyboard walkthrough (every tab stop visible, with a focus indicator) and skip link (first tab stop, visible, moves focus to `main`) | ✅ | ✅ | Pass |
| 5 | Drafts: a global draft, a draft edit of a published collage piece, and a new never-published piece. As anonymous: `?draft=true` on the global and collage (list and by id), `where[_status]=draft`, and every `/versions` endpoint. | ✅ No leaks | ✅ No leaks | Pass. The frontend also hides drafts, and the collage count stays at 22. |
| 5 | `/next/preview`: 401 when anonymous. Signed in: shows the draft, the "Preview mode" bar, and Exit returns to the published page. | ✅ | ✅ | Pass |
| 5 | Open-redirect attempts on `/next/preview` and `/next/exit-preview` | ❌ `/%09/` bypass (D2-1) | ✅ Neutralised (`Location: /`) | Node-only defect |
| 5 | Editor role: sees only their own user; cannot create or delete users or edit the admin; a self-PATCH of `role` is ignored; no Team in the nav; can edit pages, collections and Site Settings | ✅ | ✅ | Pass |
| 5 | Anonymous POST/PATCH/DELETE (single and bulk) on 5 collections; POST on 6 globals; `first-register`; GraphQL disabled | ✅ All denied | ✅ | Pass. Anonymous `GET /api/users` returns 500 (D2-3). |
| 5 | Login lockout: a throwaway user got 5 × 401, then the correct password was refused with "locked". The user was deleted afterwards. | ✅ | ✅ | Pass |
| 5 | Admin `noindex`; public security headers match the legacy `_headers`, apart from the documented same-origin framing change | ✅ | ✅ | Pass. `X-Powered-By` leaks (D2-7). The admin and API have no anti-framing headers (D1-5). |
| 5 | Secrets: the values of `PAYLOAD_SECRET` and `SEED_*` in `.next/static` (102 files) and `.open-next/{assets,cache,server-functions}` (3,015 files) | ✅ None found | ✅ None found | Pass. Production cookies are `Secure; HttpOnly; SameSite=Lax`. |
| 6 | Editor journey in the browser (see the section below) | ✅ 15 clicks. Live Preview 1.9 s; Publish → public 1.4 s | ✅ 13 clicks. Live Preview 0.9–1.9 s; **Publish → public 0.07 s, no restart** | Pass, with usability issues U1–U10 |
| 6 | On-demand revalidation in workerd (OpenNext R2 incremental cache and D1 tag cache) | n/a | ✅ | Pass for Publish, collage add and reorder, and media save. **Fails for "Unpublish"** (D1-6). |
| 7 | Lighthouse (mobile) | n/a | ❌ See the performance table | Target not met or unverifiable (D1-4) |
| 8 | `pnpm exec tsc --noEmit` | 0 errors | | Pass |
| 8 | `pnpm lint` | 0 errors, 4 warnings (none in the tests) | | Pass (D3-3) |
| 8 | `NODE_ENV=production pnpm build` | Success. All pages are dynamic (ƒ); robots and sitemap are static. | | Pass |
| 8 | `pnpm verify:content` | 202/202 before, after the security suites, and at the end | | **Pass: the DB is left clean.** Counts 22/3/3/6/2, 31 R2 objects, no `qa-` leftovers. |
| 8 | `pnpm test:int` (new) | 25 unit + 4 DB tests; 5 fail, each on a real defect (D2-1 ×3, D2-8, D2-3) | | |
| 8 | `BASE_URL=http://localhost:8787 pnpm test:e2e` (new) | | **91 passed / 8 failed.** All 8 failures are the defects listed here. | |

### Visual diff (the same for A and B)

| Route | 390 px | 1440 px |
| --- | --- | --- |
| `/` | 0.42% | 0.15% |
| `/about-me` | 0.37% | 0.23% |
| `/art` | 0.03% | 0.02% |
| `/collage-art` | **2.63%** | **1.09%** |
| `/music` | 0.03% | 0.01% |
| `/videos` | 0.03% | 0.01% |
| `/resources` | 0.27% | 0.19% |
| `/contact` | 0.03% | 0.02% |

All page heights are identical to the legacy site. The collage diff is anti-aliasing noise *inside* the artworks: the app serves the original webp, while Astro served resized AVIF. The grid geometry is identical. Evidence: `test-results/qa/visual/collage-art-mobile-{legacy,app,diff}.png`.

### Performance (Lighthouse 12.8, mobile, 2 runs each on this machine; indicative only)

| Page | Legacy (Astro, :4321), Perf/A11y/BP/SEO · LCP | Env B2 (workerd, Payload-served media), Perf/A11y/BP/SEO · LCP · transfer size |
| --- | --- | --- |
| `/` | 98/100/100/100 · 2.33 s | **74–75**/100/100/100 · **15.0–19.5 s** · 5.4 MB (hero 1.36 MB, door images 1.4 MB each) |
| `/collage-art` | 96/100/100/100 · 2.78 s | **75–76**/100/100/100 · **7.5–8.8 s** · **24.8 MB** (22 full-size originals) |
| `/about-me` | 99/100/100/100 · 1.95 s | **77–78**/100/100/100 · **6.2–6.3 s** · 954 KB |

Accessibility, Best Practices and SEO are 100 everywhere, and CLS is 0. Performance is the gap. It comes entirely from images: on workerd, `src/components/media.ts` marks every `/api/...` upload `unoptimized`. The intended production path (`MEDIA_PUBLIC_URL` → R2 custom domain → `/_next/image` → Cloudflare Images binding) cannot be exercised locally. Its hostname does not resolve, and in B1 every `/_next/image` request returned 500. Evidence: `test-results/qa/lighthouse/*.json`.

---

## Defects

Severity guide:

- **Critical:** must fix before any further work that touches Cloudflare.
- **Major:** blocks release.
- **Minor:** fix before or soon after launch.
- **Cosmetic:** optional.

### Critical

#### D1-1: `pnpm preview:local` opens a remote Cloudflare connection

- **Env:** B, as committed.
- **Repro:** `pnpm preview:local`.
- **Expected:** a Workers-runtime preview that uses only local bindings, as the commit message `f2b053d` ("local bindings only") and the script name say.
- **Actual:** after "OpenNext build complete" it prints `⎔ Establishing remote connection...`. I killed it within seconds; no wrangler or workerd processes were left.
- **Root cause:**
  - `opennextjs-cloudflare preview` first calls `getEnvFromPlatformProxy({ configPath, environment })` (`node_modules/@opennextjs/cloudflare/dist/cli/commands/preview.js:16`). That call does not set `remoteBindings: false`.
  - `wrangler.jsonc` marks the `D1` binding `"remote": true`.
  - The same flag makes a plain `wrangler dev` use the remote D1 too.
  - The trailing `-- --local` only reaches the final `wrangler dev`, and does not affect the proxy call.
- **Impact:**
  - Today the `database_id` is a placeholder, so nothing can have been written.
  - Once the real ID is filled in (DEPLOYMENT.md step 1), every "local" preview would read and write the **production content database**.
  - The TD should check the Cloudflare dashboard or audit log for a preview/remote-proxy session at about 23:46 UTC, 2026-09-22.
- **Fix direction:**
  - Remove `"remote": true` from `wrangler.jsonc`. Payload's own tooling already opts in with `PAYLOAD_REMOTE_BINDINGS=1`.
  - Or make `preview:local` use a local-only config, such as the approach in `test-results/qa/wrangler.qa-local.jsonc`.
- **Evidence:** `test-results/qa/preview-local.log` (line 93).

### Major

#### D1-2: The Workers runtime can't start with the committed `compatibility_date`

- **Env:** B.
- **Repro:** `wrangler dev --local` with `wrangler.jsonc`, or `preview:local` once D1-1 is fixed.
- **Expected:** the local workerd starts.
- **Actual:** `This Worker requires compatibility date "2026-09-01", but the newest date supported by this server binary is "2026-08-06"`. Wrangler is pinned at `~4.116.0`.
- **Impact:** the Workers runtime can't be verified locally at all. A deploy probably works, because the edge accepts dates up to today, but the local runtime and production would then differ.
- **Fix:** set `compatibility_date` to `2026-08-06`, or upgrade wrangler (4.136.x is available).
- **Evidence:** `test-results/qa/wrangler-dev-B.log` (first run, now overwritten; see the message quoted above) and `test-results/qa/wrangler.qa-local.jsonc`.

#### D1-3: `MEDIA_PUBLIC_URL` points at a hostname that doesn't exist, so all images and songs break in the Workers runtime

- **Env:** B1 (and any deploy that follows `docs/DEPLOYMENT.md`).
- **Repro:**
  1. Run workerd with the committed vars.
  2. Open `/`, `/collage-art` or `/music`.
  3. Run `dig media.nothingwrongwithyou.org`.
- **Expected:** images and audio load.
- **Actual:**
  - Every upload URL is `https://media.nothingwrongwithyou.org/<file>`, and there is no DNS record for it.
  - `/_next/image?url=https://media…` returns **500**.
  - `<audio src>` gives `ERR_NAME_NOT_RESOLVED`.
  - 42 failed requests across three pages.
- **Root cause:** `wrangler.jsonc` sets `MEDIA_PUBLIC_URL` to that host. `DEPLOYMENT.md` never makes the `nwwy-media` bucket public or attaches a custom domain or r2.dev URL. It also tells you to QA on `workers.dev`, where this var is still the unprovisioned production host.
- **Fix:**
  - Add a runbook step to create the bucket's public domain.
  - Leave `MEDIA_PUBLIC_URL` empty on preview deploys, which falls back to Payload-served files, until that domain exists.
- **Evidence:** `test-results/qa/envB/B1-committed-config-{home,collage-art,music}.png`.

#### D1-4: The performance target (≥95, LCP ≤2.5 s) is unmet on the testable path and unverified on the production path

- **Env:** B2.
- **Repro:** run Lighthouse mobile against `:8787` `/`, `/collage-art` and `/about-me`. See the performance table above.
- **Expected:** at least the legacy site's numbers (96–99, LCP 1.95–2.78 s).
- **Actual:** Performance 74–78, LCP 6.2–19.5 s; `/collage-art` transfers 24.8 MB.
- **Why:**
  - Payload-served uploads are rendered `unoptimized` by design (`src/components/media.ts`).
  - Workers has no resize step for them.
  - The hero (2000×2829, 1.36 MB) and the door thumbnails (1.4 MB each) are sent in full.
- **Needed before sign-off:**
  - Lighthouse on a real preview deploy with the R2 custom domain and the Cloudflare Images binding active.
  - Until then, "Payload-served fallback = originals" makes any preview deploy without D1-3 fixed slow as well as broken.

#### D1-5: The admin and API send no anti-framing headers (clickjacking)

- **Env:** A, `next start` (production build).
- **Repro:** `curl -I http://localhost:3000/admin/login` and `/api/users/me`.
- **Expected:** `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors 'self'`, plus `nosniff`, as the public pages send.
- **Actual:** none of these headers. `next.config.ts` `headers()` deliberately excludes `admin` and `api`, and Payload adds nothing.
- **Impact:** any site can frame `/admin` and trick a signed-in editor into clicking "Publish changes", "Unpublish" or Delete.
- **Fix:** send `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'` on `/admin/:path*`. Live Preview only frames the *public* site inside the admin, so that keeps working.
- **Evidence:** the command output quoted in this report. Test: `tests/e2e/security-headers.e2e.spec.ts` (public pages only).

#### D1-6: "Unpublish" on a page leaves the site stale, then renders a blank page

- **Env:** A and B2.
- **Repro:**
  1. Sign in as the editor and open **Pages → About**.
  2. Choose **⋯ → Unpublish → Confirm**. The UI sends `POST /api/globals/about-page?unpublishAllLocales=true {"_status":"draft"}`.
  3. As anonymous, load `/about-me`.
  4. Trigger any cache refill: save any image, or wait for another publish.
  5. Load `/about-me` again.
- **Expected:** a defined outcome. Either the change is not allowed for page globals, or the page is replaced by a clear "not available" state, immediately.
- **Actual:**
  - In step 3 the page still shows the old content. `revalidateGlobal` skips docs with `_status === 'draft'`, so Unpublish never expires the cache.
  - After the refill in step 5, the page is **HTTP 200 with an empty `<h1>`, no portrait, no body**, and the title reads "Nothing Wrong With You — Nothing Wrong With You".
- **Evidence:** reproduced by script on B2: `before: h1=[Nobody is coming…]`, `after: h1=[Nobody is coming…]` (stale), `after cache miss: h1=[] title=[Nothing Wrong With You — Nothing Wrong With You] portrait=false`. The screenshot `test-results/qa/cms/13-unpublish-confirm.png` shows the one-word confirmation ("Cancel | Confirm").
- **Fix direction:**
  - Hide Unpublish for page globals, so they always have a published version.
  - Or revalidate on unpublish (`previousDoc._status === 'published'`, as the collection hook already does) and render a safe fallback.

### Minor

#### D2-1: Open redirect via control characters in `?path=`

- **Env:** A (Node runtime: `next dev` and `next start`). **Not** reproducible on workerd, where the Location header becomes `/`.
- **Repro:** open `http://localhost:3000/next/exit-preview?path=%2F%09%2Fexample.com%2Fphish` anonymously.
- **Expected:** a redirect that stays on the same site.
- **Actual:**
  - The response is `307 Location: /<TAB>/example.com/phish`.
  - Browsers strip the tab, so Chromium **lands on `https://example.com/phish`** (verified by request trace).
  - `%0A` and `%0D` also pass `safePath`.
  - `/next/preview` has the same bug, but it only redirects after sign-in.
- **Fix:** in `src/app/next/safePath.ts`, reject control characters (`/[\x00-\x1f\x7f]/`). Better, resolve the value with `new URL(value, 'http://x')` and require the same origin.
- **Evidence:** `tests/int/units.int.spec.ts` (3 failing cases) and `tests/e2e/security-headers.e2e.spec.ts`.

#### D2-2: Home canonical and `og:url` drop the trailing slash

- **Env:** A and B.
- **Repro:** view the source of `/`.
- **Expected:** `https://www.nothingwrongwithyou.org/`, as the legacy site and the new sitemap use.
- **Actual:** `https://www.nothingwrongwithyou.org`. Next normalises the root URL.
- **Impact:** the canonical and the sitemap disagree, which is a small SEO inconsistency.
- **Evidence:** `test-results/qa/parity/home-1440.json`. Tests: parity, and `tests/int/units.int.spec.ts` ("home canonical"). The unit test passes, which shows the metadata object is correct and Next rewrites it at render time.

#### D2-3: Anonymous `GET /api/users` and `/api/users/:id` return 500

- **Env:** A and B.
- **Repro:** `curl http://localhost:3000/api/users`.
- **Expected:** 403, or an empty list.
- **Actual:** `500 {"errors":[{"message":"Something went wrong."}]}`. `Users.access.read` returns `{ id: { equals: req.user?.id } }` with `undefined`, which gives `D1_TYPE_ERROR: Type 'undefined' not supported`.
- **Impact:** no data leaks, but it produces error noise and a probeable 500.
- **Evidence:** `tests/int/api.int.spec.ts` ("cannot read users").

#### D2-4: HEAD on uploaded files returns 404 JSON

- **Env:** A and B.
- **Repro:** `curl -I /api/songs/file/we-survived.mp3`.
- **Expected:** 200 with `Content-Type: audio/mpeg`.
- **Actual:** `404 application/json`. GET works.
- **Impact:** link checkers, some podcast and audio clients, and CDN probes report the files as missing.

#### D2-5: Range requests are wrong under `next dev`; 206 responses lack Content-Length on workerd

- **Env:** A (dev only).
- **Repro:** `curl -H 'Range: bytes=1000-1999' localhost:3000/api/songs/file/we-survived.mp3`.
- **Expected:** a 206 with a 1000-byte body.
- **Actual:** `206`, `content-length: 1000`, `content-range: bytes 1000-1999/10070765`, but the **whole file** (10,070,765 bytes) is streamed. Keep-alive clients fail ("Parse Error").
- **Cause:** upstream `@payloadcms/storage-r2` `getFile.js` sets `isMiniflare = NODE_ENV === 'development'` and skips the ranged `bucket.get`.
- **On workerd (B2):** the 206 body is correct, but it is chunked without `Content-Length`. Safari is strict about this for media seeking. This only matters if audio is served through the Worker, meaning `MEDIA_PUBLIC_URL` is unset.
- **Evidence:** `tests/e2e/interactions.e2e.spec.ts` ("Range requests").

#### D2-6: The old audio URLs now return 404

- **Env:** A and B.
- **Repro:** request `/audio/we-survived.mp3`.
- **Expected:** a 301 to the new file. The legacy site served `/audio/*.mp3` and linked it as "Download … (MP3)".
- **Actual:** 404.
- **Fix:** add 301 redirects to the new media URLs.

#### D2-7: `X-Powered-By: Next.js, Payload` on every response

- **Fix:** set `poweredByHeader: false` in `next.config.ts`. The legacy site sent no such header.

#### D2-8: The YouTube link check accepts non-IDs

- **Repro:** `parseYouTubeId('https://www.youtube.com/watch?v=<script>')` returns `'<script>'`, so the Videos field validation passes. The value then goes into the iframe `src` and the ytimg URL.
- **Impact:** React escapes it, so there is no XSS. But it lets junk through and builds odd URLs.
- **Fix:** require `/^[\w-]{11}$/` for `v` as well.
- **Evidence:** `tests/int/units.int.spec.ts`.

#### D2-9: The data cache never expires by time, so a change to an environment variable doesn't show without a publish

- **Env:** B.
- **Repro:** change `MEDIA_PUBLIC_URL` and restart without rebuilding.
- **Actual:** pages keep the old media URLs until some Media document is saved, which expires the `collection:media` tag.
- **Fix:** add a runbook note to rebuild, or purge `nwwy-next-cache`, after changing environment variables.

#### D2-10: Admin accessibility in the "Add new" image drawer

- **Env:** A and B.
- **Issues:**
  - The **"Image description" input has no accessible name**: the label isn't associated with it.
  - The dialog's accessible name is the internal id "doc-drawer_media_1__r_4_".
  - The heading reads "[Untitled]".
- **Impact:** screen-reader users can't tell what the required field is.
- **Note:** upstream Payload, but it can be mitigated with a custom label component or reported upstream.
- **Evidence:** the page snapshot in the Playwright error context from the journey development runs; `test-results/qa/cms/06-drawer.png`.

### Cosmetic

- **D3-1:** The `/collage-art` visual diff is above 1% because of image re-encoding (see above). This is expected; it goes away once images are served through Cloudflare Images.
- **D3-2:** Anonymous `/api/users/me` returns `"message":"Your account"`. `authentication.account` is overridden in `src/admin/translations.ts`, and that string is also used as an API message.
- **D3-3:** Lint warnings:
  - `migrations` is imported but unused in `src/payload.config.ts` (no `prodMigrations`; fine if migrations always run through `deploy:database`).
  - `next build` warns "Custom Cache-Control headers detected" for `/_next/static`.

---

## CMS usability (for the CMS UX owner)

**Journey measured as the editor.** Test: `tests/e2e/editor-journey.e2e.spec.ts`.

| Step | Clicks (running total) | Env A | Env B2 |
| --- | --- | --- | --- |
| Log in | 1 | | |
| Home card, then the editor opens with Live Preview | 2 | | |
| "About Becca" tab, then edit the text | 3 | preview 1.9 s | preview 0.9 s |
| Replace the portrait: Remove, Add new, choose file, alt text, Save | 6 | preview 1.9 s | preview 1.9 s |
| Publish changes, then the public `/` shows the change | 7 | **1.4 s** | **0.07 s** |
| Add a collage piece: card, file, alt text, Publish | 11 | appears last on `/collage-art` | same |
| Reorder to the top: "See all pieces or reorder", **Per Page: 50** (2 clicks), drag | 15 (A) / 13 (B, which remembered the page size) | on `/collage-art` in 0.09 s | 0.02 s |

Everything was restored afterwards, and the editor's list page size was reset to 10.

### Usability issues

- **U1 (high): Moving a new collage piece to the top is effectively impossible without a hidden step.**
  - The list shows 10 per page, and new pieces go *last* (#23, page 3).
  - Drag only works within a page, so the editor must first find "Per Page" at the bottom and choose 50.
  - Even then, it is a long drag that relies on auto-scroll: my first mouse drag dropped the piece one place too low.
  - Keyboard reordering (Space and arrow keys) moved the piece only part of the way: 23 presses of ArrowUp left it after piece #6.
  - **Suggest:** a default list limit of 100 for Collage, Songs and Videos; an "Add to the top" option or top insertion; and saying this on the dashboard link.
- **U2 (high): "Unpublish"** sits in the ⋯ menu of every page, with a bare "Cancel / Confirm" dialog, and it breaks the page (D1-6). It is untranslated and unexplained. Hide it for page globals.
- **U3:** Replacing a picture takes Remove → Add new → drawer → Save → *then* Publish. That is two different "save" concepts in one task. The drawer title is "[Untitled]".
- **U4:** The drawer shows the Images library description ("Replacing the file of an image here changes it on every page…") while you are *creating* a new image. This reads as a warning that doesn't apply.
- **U5:** "Paste a link" in the upload box is unexplained, and a non-technical user may paste a web page URL.
- **U6:** The Live Preview toolbar opens on "Responsive" with raw pixel inputs (e.g. 864 × 802) and a zoom menu. The configured Phone/Tablet/Desktop sizes are hidden inside that dropdown.
- **U7:** "Edit" and "History" tabs sit beside the page title while you are already editing. "Edit" reads like a button that does nothing.
- **U8:** Collage list columns: "File" is a thumbnail only; "Title (optional)" shows "—" for all 22 pieces, which is wasted width.
- **U9:** The dashboard "Recently edited" list shows every system or QA save as "just now". This is fine, but saves made by the developer look like the client's own edits.
- **U10:** Forgotten password: no email adapter is configured, so "Forgot password?" on the login page can't work. The guide rightly says to ask the developer; consider hiding the link.

### Client guide (`docs/CLIENT-GUIDE.md`) vs the actual admin

| Guide says | Actual | Action |
| --- | --- | --- |
| "Click your picture (**bottom left**) to change your name, email or password" | The account avatar is at the **top right** | Fix the guide |
| "The preview shows a thin **Preview mode bar at the top**" | A pill labelled "Preview mode · Exit" at the **bottom right** | Fix the guide |
| Reordering: "click **See all pieces or reorder**, then drag a piece by the handle on its left" | Only 10 pieces are shown, and new pieces are on the last page. You must change **Per Page** first (U1). | Fix the guide or the admin |
| "If you make a mistake … ⋯ menu → **Discard unpublished changes**" | Correct, but it only appears when a draft exists. The same menu always offers **Unpublish**, which the guide doesn't mention and which breaks the page (D1-6). | Add a warning, or remove Unpublish |
| "Already published? … **History** … **Bring back this version**" | The History tab and version list exist ("Currently Published / Previously Published"), and the label is in the translations. **I did not verify the restore end to end** (not automated). | Verify |

These match: the tabs *Top of page / Message / About Becca / …*, **Remove**, **Add new**, **Choose from library**, **Publish changes**, the eye icon, the size menu, the four Site settings tabs, the star returning to the home screen, the dashboard cards, and "Settings … go live as soon as you press Save".

---

## What could not be tested, and why

- **The real Cloudflare edge:** remote D1/R2, the R2 custom domain, Cloudflare Images transformations and the production Lighthouse numbers. These are forbidden by the safety rules, and there is no preview deploy yet. They must be re-run on the `workers.dev` preview after D1-1 to D1-3 are fixed.
- **`pnpm preview:local` as committed:** unsafe (D1-1) and broken (D1-2). Env B was run with the QA-only config copy described above, which has three deliberate deviations (no remote flag, compatibility date, `MEDIA_PUBLIC_URL` empty for B2). The OpenNext R2 cache populate step was skipped.
- **Browsers other than Chromium:** Safari (audio Range without Content-Length, D2-5) and Firefox.
- **Manual screen-reader passes (VoiceOver/NVDA):** only axe and scripted keyboard checks were done.
- **History "Bring back this version" end to end,** scheduled publishing (out of scope), and the password-reset email (no adapter).

---

## Test assets added

All files are uncommitted, as instructed.

| Path | What |
| --- | --- |
| `playwright.config.ts` | Rewritten. No auto-started `pnpm dev`. `BASE_URL` and `LEGACY_URL` via env. Two projects: `readonly` (parallel) and `mutating` (one worker). |
| `package.json` | Added `test:e2e` (runs readonly, then mutating), `test:e2e:readonly`, `test:e2e:mutating`, `test:e2e:dev` (:3000) and `test:e2e:workers` (:8787). Dev dependencies added: `@axe-core/playwright`, `pixelmatch`, `pngjs`, `@types/pngjs`. The lockfile is updated. |
| `tests/e2e/support/{site,api}.ts` | Shared helpers: DOM fact extraction, REST login from `.env` (passwords are never logged), and a PNG generator. |
| `tests/e2e/parity.e2e.spec.ts` | Area 1 |
| `tests/e2e/visual.e2e.spec.ts` | Area 2. Writes to `test-results/qa/visual/`. |
| `tests/e2e/interactions.e2e.spec.ts` | Area 3 |
| `tests/e2e/contact-form.e2e.spec.ts` | Area 3. Sets a fake ID temporarily and intercepts Formspree. |
| `tests/e2e/a11y.e2e.spec.ts` | Area 4 |
| `tests/e2e/security.e2e.spec.ts` | Area 5, stateful: drafts, preview, roles, anonymous writes, lockout. Restores content. |
| `tests/e2e/security-headers.e2e.spec.ts` | Area 5, stateless: open redirects and headers |
| `tests/e2e/editor-journey.e2e.spec.ts` | Area 6. Restores content. |
| `tests/e2e/admin.e2e.spec.ts`, `tests/e2e/frontend.e2e.spec.ts`, `tests/helpers/login.ts` | Stale template tests replaced with smoke tests for this app. `tests/helpers/seedUser.ts` removed (weak hard-coded credentials, no longer used). |
| `tests/int/units.int.spec.ts`, `tests/int/api.int.spec.ts` | Area 8. Unit tests, plus Local API access tests (node environment). |

**Evidence** is in `test-results/qa/`, which is gitignored:

- logs: `*-A.log`, `*-B.log`, `full-suite-B.log`, `preview-local.log`, `wrangler-dev-B*.log`, `build-prod.log`, `verify-content-*.log`
- `parity/`, `visual/` and `visual-B/`, `axe/`, `lighthouse/`
- `cms/`: screenshots and `journey-3000.json`, `journey-8787.json`
- `envB/`: broken-media screenshots
- `wrangler.qa-local.jsonc`

**Final state:**

- `verify:content` passes 202/202.
- Counts are 22 collage, 3 songs, 3 videos, 6 images, 2 users; 31 R2 objects.
- No QA users, media or drafts remain.
- No servers were left running by QA. The TD's legacy preview on :4321 is untouched.

---

## Addendum: Technical Director fixes and re-test (2026-09-22)

Re-tested on the local Workers runtime (`opennextjs-cloudflare preview -- --local`) with a deliberately invalid `CLOUDFLARE_API_TOKEN`. Logs are in `test-results/td-*.log`.

| Defect | Fix | Re-test |
| --- | --- | --- |
| **D1-1 Critical**: local preview opened a remote session | Removed `"remote": true` from all top-level bindings. Real D1/R2 now exist only in `env.remote`, selected solely by `PAYLOAD_REMOTE_BINDINGS=1`. `preview:local` passes `--local`. | Build and preview logs: 0 remote/edge-preview lines (searched as text with `grep -a`) |
| D1-2 Major: compatibility date | `2026-08-01` | Workers runtime starts |
| D1-3 Major: media domain doesn't exist | `MEDIA_PUBLIC_URL` is empty by default. Pictures are served by the Worker, unoptimised, so they display. The r2.dev URL (preview) and custom domain (cutover) steps are in DEPLOYMENT.md | All pages 200, images load |
| D1-4 Major: performance unverified | Made a release gate on the preview deploy (DEPLOYMENT.md). Needs production image path | **Open**: measure on preview deploy |
| D1-5 Major: admin/API framing | `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` on `/admin` and `/api` | Headers present |
| D1-6 Major: Unpublish on pages | The Unpublish button is removed from pages (official `UnpublishButton` override). The revalidation hook also expires the cache when a published global becomes a draft | Button gone |
| Open redirect via `/next/exit-preview` | `safePath` now parses with WHATWG URL and requires same origin | `/%09/example.com`, `//example.com`, `/\example.com` → `/` |
| Anonymous `GET /api/users` returns 500 | Access returns `false` without a user | 403 |
| Old `/audio/*.mp3` returns 404 | 301 to `/api/songs/file/*` | 301, Range → 206 |
| `X-Powered-By: Next.js, Payload` | `poweredByHeader: false` | Header gone |
| U1: reorder needs "Per Page" | Art lists default to 100 per page | Editor journey passes |
| Guide mismatches | Avatar position, Preview-mode label, Unpublish vs Delete for art items | — |

**Suite on the Workers runtime:** 94 passed, 5 failed. All 5 are accepted minors:

- **Home canonical has no trailing slash (×2):** Next.js normalises it; search engines treat both forms as the same URL.
- **`HEAD` on uploaded files returns 404:** Payload's R2 handler serves GET only; browsers use GET/Range for audio.
- **`/collage-art` visual diff (1.1% and 2.6%, ×2):** image re-encoding, not layout, as diagnosed above. Re-check after the production image path is live.

`verify:content` 202/202 · `tsc` clean · `lint` 0 errors.

**Revised verdict:** Ready for a **preview deploy**. Production cutover is gated on D1-4, the performance measurement on the preview deploy.
