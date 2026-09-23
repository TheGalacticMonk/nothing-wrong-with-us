import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { AboutLive } from './AboutLive'
import { AboutView } from './AboutView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('about-page'), getSiteSettings()])
  return pageMetadata({ path: '/about-me', seo: page?.seo, settings })
}

export default async function AboutPage() {
  const [page, settings, draft] = await Promise.all([
    getGlobal('about-page'),
    getSiteSettings(),
    draftMode(),
  ])

  if (draft.isEnabled) {
    return <AboutLive initialPage={page} settings={settings} />
  }

  return <AboutView page={page} settings={settings} />
}
