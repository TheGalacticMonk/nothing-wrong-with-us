import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { ArtLive } from './ArtLive'
import { ArtView } from './ArtView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/art', seo: page?.art?.seo, settings })
}

export default async function ArtPage() {
  const [page, collage, songs, videos, draft] = await Promise.all([
    getGlobal('art-page'),
    getCollection('collage'),
    getCollection('songs'),
    getCollection('videos'),
    draftMode(),
  ])

  const shared = { collageCount: collage.length, songsCount: songs.length, videosCount: videos.length }

  if (draft.isEnabled) {
    return <ArtLive initialPage={page} {...shared} />
  }

  return <ArtView page={page} {...shared} />
}
