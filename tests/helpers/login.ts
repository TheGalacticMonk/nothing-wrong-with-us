import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: { email: string; password: string }
}

/** Logs in through the admin login page and waits for the task dashboard ("Hello, <name>."). */
export async function login({
  page,
  serverURL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)
  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/?$/)
  await expect(page.getByRole('heading', { name: /^Hello/ })).toBeVisible()
}
