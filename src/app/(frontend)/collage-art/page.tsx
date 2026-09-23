import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { CollagePageLive } from './CollagePageLive'
import { CollagePageView } from './CollagePageView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/collage-art', seo: page?.collage?.seo, settings })
}

export default async function CollagePage() {
  const [page, collage, draft] = await Promise.all([
    getGlobal('art-page'),
    getCollection('collage'),
    draftMode(),
  ])

  if (draft.isEnabled) {
    return <CollagePageLive page={page} initialCollage={collage} />
  }

  return <CollagePageView page={page} collage={collage} />
}
