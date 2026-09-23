import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { MusicPageLive } from './MusicPageLive'
import { MusicPageView } from './MusicPageView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/music', seo: page?.songs?.seo, settings })
}

export default async function MusicPage() {
  const [page, songs, draft] = await Promise.all([
    getGlobal('art-page'),
    getCollection('songs'),
    draftMode(),
  ])

  if (draft.isEnabled) {
    return <MusicPageLive page={page} initialSongs={songs} />
  }

  return <MusicPageView page={page} songs={songs} />
}
