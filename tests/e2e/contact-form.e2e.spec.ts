import { expect, test } from '@playwright/test'

import { creds, login } from './support/api'
import { BASE_URL } from './support/site'

/**
 * Contact form with a (fake) Formspree ID set temporarily in Site Settings. Every request to
 * formspree.io is intercepted in the browser; nothing is ever sent to Formspree.
 */
test.describe.configure({ mode: 'serial' })

const FAKE_ID = 'qaFake1234'
let admin: Awaited<ReturnType<typeof login>>
let original: string | null = null

test.beforeAll(async ({ request }) => {
  test.skip(!creds.admin.email, 'SEED_ADMIN_* not set')
  admin = await login(request, creds.admin)
  const s = await (await request.get(`${BASE_URL}/api/globals/site-settings?depth=0`, admin)).json()
  original = s.contactForm?.formspreeId ?? null
  const r = await request.post(`${BASE_URL}/api/globals/site-settings`, { ...admin, data: { contactForm: { formspreeId: FAKE_ID } } })
  expect(r.ok()).toBeTruthy()
})

test.afterAll(async ({ request }) => {
  if (!admin) return
  const r = await request.post(`${BASE_URL}/api/globals/site-settings`, { ...admin, data: { contactForm: { formspreeId: original } } })
  expect(r.ok()).toBeTruthy()
  const s = await (await request.get(`${BASE_URL}/api/globals/site-settings?depth=0`)).json()
  expect(s.contactForm?.formspreeId ?? null).toBe(original)
})

const intercept = async (page: import('@playwright/test').Page, status: number) => {
  const sent: { url: string; body: string }[] = []
  await page.context().route(/formspree\.io/, async (route) => {
    sent.push({ url: route.request().url(), body: route.request().postData() ?? '' })
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status < 300 ? { ok: true } : { error: 'fail' }) })
  })
  return sent
}

test('publishing the ID updates /contact immediately (no restart)', async ({ page }) => {
  await page.goto(`${BASE_URL}/contact`)
  const form = page.locator('form[aria-labelledby="form-title"]')
  await expect(form).toHaveAttribute('action', `https://formspree.io/f/${FAKE_ID}`)
  await expect(form.getByRole('button', { name: 'Send message' })).toBeEnabled()
})

test('validation messages: empty, bad email, then fixed', async ({ page }) => {
  const sent = await intercept(page, 200)
  await page.goto(`${BASE_URL}/contact`)
  const form = page.locator('form[aria-labelledby="form-title"]')
  await form.getByRole('button', { name: 'Send message' }).click()
  await expect(page.locator('#cf-name-error')).toHaveText('Please enter your name.')
  await expect(page.locator('#cf-email-error')).toHaveText('Please enter your email address.')
  await expect(page.locator('#cf-message-error')).toHaveText('Please write a message.')
  await expect(page.locator('#cf-name')).toBeFocused()
  await expect(page.locator('#cf-name')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#cf-name')).toHaveAttribute('aria-describedby', 'cf-name-error')

  await page.locator('#cf-name').fill('QA Tester')
  await page.locator('#cf-email').fill('not-an-email')
  await page.locator('#cf-email').blur()
  await expect(page.locator('#cf-email-error')).toHaveText('Enter a valid email address, like name@example.com.')
  await expect(page.locator('#cf-name-error')).toBeHidden()
  expect(sent).toHaveLength(0)
})

test('success state (intercepted 200)', async ({ page }) => {
  const sent = await intercept(page, 200)
  await page.goto(`${BASE_URL}/contact`)
  await page.locator('#cf-name').fill('QA Tester')
  await page.locator('#cf-email').fill('qa@example.test')
  await page.locator('#cf-topic').selectOption({ index: 1 })
  await page.locator('#cf-message').fill('Automated QA message: intercepted, never sent.')
  await page.getByRole('button', { name: 'Send message' }).click()
  const status = page.getByRole('status').filter({ hasText: /Thank you/ })
  await expect(status).toHaveText('Thank you. Your message has been sent.')
  await expect(status).toBeFocused()
  await expect(page.locator('#cf-name')).toHaveValue('')
  expect(sent).toHaveLength(1)
  expect(sent[0].url).toBe(`https://formspree.io/f/${FAKE_ID}`)
  for (const field of ['name', 'email', 'topic', 'message', '_gotcha']) expect(sent[0].body).toContain(`name="${field}"`)
})

test('failure state (intercepted 500) keeps the message', async ({ page }) => {
  await intercept(page, 500)
  await page.goto(`${BASE_URL}/contact`)
  await page.locator('#cf-name').fill('QA Tester')
  await page.locator('#cf-email').fill('qa@example.test')
  await page.locator('#cf-message').fill('Keep me')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status').filter({ hasText: /went wrong/ })).toHaveText(
    'Something went wrong and your message was not sent. Please try again.',
  )
  await expect(page.locator('#cf-message')).toHaveValue('Keep me')
  await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled()
})

test('network failure (aborted) shows the error', async ({ page }) => {
  await page.context().route(/formspree\.io/, (route) => route.abort('failed'))
  await page.goto(`${BASE_URL}/contact`)
  await page.locator('#cf-name').fill('QA Tester')
  await page.locator('#cf-email').fill('qa@example.test')
  await page.locator('#cf-message').fill('x')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status').filter({ hasText: /went wrong/ })).toBeVisible()
})

test('Formspree validation errors (intercepted 422) appear next to the field and in the status', async ({ page }) => {
  const sent: string[] = []
  await page.context().route(/formspree\.io/, async (route) => {
    sent.push(route.request().postData() ?? '')
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [
          { field: 'email', code: 'TYPE_EMAIL', message: 'should be an email' },
          { code: 'FORM_DISABLED', message: 'This form is disabled.' },
        ],
      }),
    })
  })
  await page.goto(`${BASE_URL}/contact`)
  await page.locator('#cf-name').fill('QA Tester')
  await page.locator('#cf-email').fill('qa@example.test')
  await page.locator('#cf-message').fill('Keep me')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.locator('#cf-email-error')).toHaveText('should be an email')
  await expect(page.locator('#cf-email')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('status').filter({ hasText: /not sent/ })).toHaveText(
    'Your message was not sent: This form is disabled.',
  )
  await expect(page.locator('#cf-message')).toHaveValue('Keep me')
  // The notification email gets a recognisable subject.
  expect(sent[0]).toContain('New message from nothingwrongwithyou.org')
})
