import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

/**
 * Any URL that no other route matches ends up here, so it renders the styled not-found page
 * inside the site layout (the app has two root layouts, so there is no global app/not-found).
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return pageMetadata({
    path: '/404',
    settings,
    title: 'Page not found',
    description: 'That page could not be found.',
    noindex: true,
  })
}

export default function CatchAll() {
  notFound()
}
