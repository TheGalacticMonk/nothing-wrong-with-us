import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { VideosPageLive } from './VideosPageLive'
import { VideosPageView } from './VideosPageView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/videos', seo: page?.videos?.seo, settings })
}

export default async function VideosPage() {
  const [page, settings, videos, draft] = await Promise.all([
    getGlobal('art-page'),
    getSiteSettings(),
    getCollection('videos'),
    draftMode(),
  ])

  if (draft.isEnabled) {
    return <VideosPageLive page={page} settings={settings} initialVideos={videos} />
  }

  return <VideosPageView page={page} settings={settings} videos={videos} />
}
