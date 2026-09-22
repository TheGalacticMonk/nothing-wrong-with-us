import { Fraunces } from 'next/font/google'

/**
 * The site's display face, self-hosted by next/font (no request to Google at runtime).
 * Used only for the wordmark and large headings in the admin; body text stays in the
 * system sans-serif for easy reading of forms.
 */
export const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
})
