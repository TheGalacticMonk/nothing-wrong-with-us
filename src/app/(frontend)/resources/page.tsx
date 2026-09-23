import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { ResourcesLive } from './ResourcesLive'
import { ResourcesView } from './ResourcesView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('resources-page'), getSiteSettings()])
  return pageMetadata({ path: '/resources', seo: page?.seo, settings })
}

export default async function ResourcesPage() {
  const [page, settings, draft] = await Promise.all([
    getGlobal('resources-page'),
    getSiteSettings(),
    draftMode(),
  ])

  if (draft.isEnabled) {
    return <ResourcesLive initialPage={page} settings={settings} />
  }

  return <ResourcesView page={page} settings={settings} />
}
