import type { Metadata } from 'next'

import { ArtCard } from '@/components/ArtCard'
import { PageHeader } from '@/components/PageHeader'
import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/art', seo: page?.art?.seo, settings })
}

export default async function ArtPage() {
  const [page, collage, songs, videos] = await Promise.all([
    getGlobal('art-page'),
    getCollection('collage'),
    getCollection('songs'),
    getCollection('videos'),
  ])

  return (
    <>
      <PageHeader eyebrow="Art" title={page?.art?.heading} />
      <div className={`wrap ${styles.grid}`}>
        <ArtCard href="/collage-art" title="Collage" meta={`${collage.length} pieces`} />
        <ArtCard href="/music" title="Songs" meta={`${songs.length} songs`} />
        <ArtCard href="/videos" title="Videos" meta={`${videos.length} pieces`} />
      </div>
    </>
  )
}
