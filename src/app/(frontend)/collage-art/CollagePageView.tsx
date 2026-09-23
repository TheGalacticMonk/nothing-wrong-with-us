import { ArtNav } from '@/components/ArtNav'
import { CollageGallery, type CollageItem } from '@/components/CollageGallery'
import { asUpload, imageSource } from '@/components/media'
import { PageHeader } from '@/components/PageHeader'
import type { ArtPage as ArtPageData, Collage } from '@/payload-types'
import styles from '../art-section.module.css'

export interface CollagePageViewProps {
  page: ArtPageData | null | undefined
  collage: Collage[]
}

const toItems = (collage: Collage[]): CollageItem[] =>
  collage.flatMap((piece) => {
    const upload = asUpload(piece)
    return upload ? [{ id: piece.id, alt: piece.alt ?? '', ...imageSource(upload) }] : []
  })

/** Pure presentational render of the Collage page. */
export const CollagePageView = ({ page, collage }: CollagePageViewProps) => (
  <>
    <PageHeader eyebrow="Art" title={page?.collage?.heading}>
      <div className={styles.nav}>
        <ArtNav path="/collage-art" />
      </div>
    </PageHeader>
    <CollageGallery items={toItems(collage)} />
  </>
)
