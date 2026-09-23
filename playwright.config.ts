import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * QA suites for nothingwrongwithyou.org. No web server is started: run the app first, then
 *   BASE_URL=http://localhost:3000 pnpm test:e2e              # env A: next dev
 *   BASE_URL=http://localhost:8787 pnpm test:e2e              # env B: wrangler dev --local (workerd)
 * (or pnpm test:e2e:dev / pnpm test:e2e:workers). Credentials come from .env (SEED_ADMIN_*, SEED_EDITOR_*).
 * LEGACY_URL (default http://localhost:4321) is the Astro build, for parity and visual diffs.
 * Suites that change CMS content restore it afterwards.
 */
const MUTATING = /(security|contact-form|editor-journey)\.e2e\.spec\.ts/

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.e2e\.spec\.ts/,
  outputDir: 'test-results/playwright',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : 4,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      // Read-only suites, in parallel.
      name: 'readonly',
      testIgnore: MUTATING,
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
    {
      // Suites that change (and restore) CMS content, one at a time. `pnpm test:e2e` runs this
      // project after `readonly` (not via `dependencies`, which would skip it if readonly fails).
      name: 'mutating',
      testMatch: MUTATING,
      workers: 1,
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
})
