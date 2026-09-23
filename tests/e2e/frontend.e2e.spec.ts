import { expect, test } from '@playwright/test'

import { BASE_URL, ROUTES } from './support/site'

/** Fast smoke test: every public route renders its heading, header and footer without console errors. */
test.describe('Frontend smoke', () => {
  for (const route of ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text())
      })
      const res = await page.goto(BASE_URL + route)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      expect(errors).toEqual([])
    })
  }

  test('home page title and hero', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await expect(page).toHaveTitle('Nothing Wrong With You: You Can Save Yourself')
    await expect(page.locator('#hero-title')).toContainText('Nothing')
  })
})
