import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'
import { creds } from './support/api'
import { BASE_URL } from './support/site'

/** Admin smoke test for the developer (admin role). Editor-specific checks: security + editor-journey. */
test.describe('Admin panel (admin role)', () => {
  test.skip(!creds.admin.email, 'SEED_ADMIN_* not set')

  test('login page is branded and noindex', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`)
    await expect(page).toHaveTitle(/Nothing Wrong With You/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('dashboard shows the task cards; admin also sees Team', async ({ page }) => {
    await login({ page, user: creds.admin })
    for (const card of ['Edit the Home page', 'Add a collage piece', 'Add a song', 'Add a video']) {
      await expect(page.getByRole('link', { name: new RegExp(card) })).toBeVisible()
    }
    await page.goto(`${BASE_URL}/admin/collections/users`)
    await expect(page.getByRole('heading', { name: 'Team', level: 1 })).toBeVisible()
  })

  test('every page global and collection opens', async ({ page }) => {
    await login({ page, user: creds.admin })
    for (const path of [
      'globals/home-page', 'globals/about-page', 'globals/art-page', 'globals/resources-page',
      'globals/contact-page', 'globals/site-settings', 'collections/collage', 'collections/songs',
      'collections/videos', 'collections/media',
    ]) {
      const res = await page.goto(`${BASE_URL}/admin/${path}`)
      expect(res?.status(), path).toBeLessThan(400)
      await expect(page.locator('h1').first(), path).toBeVisible()
    }
  })
})
