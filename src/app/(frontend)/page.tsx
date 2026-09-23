import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { HomeLive } from './HomeLive'
import { HomeView } from './HomeView'

export async function generateMetadata(): Promise<Metadata> {
  const [home, settings] = await Promise.all([getGlobal('home-page'), getSiteSettings()])
  return pageMetadata({ path: '/', seo: home?.seo, settings, isHome: true })
}

export default async function HomePage() {
  const [home, settings, collage, songs, videos, draft] = await Promise.all([
    getGlobal('home-page'),
    getSiteSettings(),
    getCollection('collage'),
    getCollection('songs'),
    getCollection('videos'),
    draftMode(),
  ])

  const shared = {
    settings,
    collage,
    songsCount: songs.length,
    videosCount: videos.length,
  }

  // Live Preview (draft mode, inside the admin iframe): sync instantly on every field change
  // instead of waiting for the autosave round trip. Every other visitor gets the plain,
  // server-rendered view below, with no extra client JS.
  if (draft.isEnabled) {
    return <HomeLive initialHome={home} {...shared} />
  }

  return <HomeView home={home} {...shared} />
}
