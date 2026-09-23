import type { Metadata } from 'next'

import { ArtNav } from '@/components/ArtNav'
import { CollageGallery, type CollageItem } from '@/components/CollageGallery'
import { asUpload, imageSource } from '@/components/media'
import { PageHeader } from '@/components/PageHeader'
import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import styles from '../art-section.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/collage-art', seo: page?.collage?.seo, settings })
}

export default async function CollagePage() {
  const [page, collage] = await Promise.all([getGlobal('art-page'), getCollection('collage')])
  const items: CollageItem[] = collage.flatMap((piece) => {
    const upload = asUpload(piece)
    return upload ? [{ id: piece.id, alt: piece.alt ?? '', ...imageSource(upload) }] : []
  })

  return (
    <>
      <PageHeader eyebrow="Art" title={page?.collage?.heading}>
        <div className={styles.nav}>
          <ArtNav path="/collage-art" />
        </div>
      </PageHeader>
      <CollageGallery items={items} />
    </>
  )
}
