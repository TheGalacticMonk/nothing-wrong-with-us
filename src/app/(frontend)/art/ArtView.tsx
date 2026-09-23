import { ArtCard } from '@/components/ArtCard'
import { PageHeader } from '@/components/PageHeader'
import type { ArtPage as ArtPageData } from '@/payload-types'
import styles from './page.module.css'

export interface ArtViewProps {
  page: ArtPageData | null | undefined
  collageCount: number
  songsCount: number
  videosCount: number
}

/** Pure presentational render of the Art landing page. */
export const ArtView = ({ page, collageCount, songsCount, videosCount }: ArtViewProps) => (
  <>
    <PageHeader eyebrow="Art" title={page?.art?.heading} />
    <div className={`wrap ${styles.grid}`}>
      <ArtCard href="/collage-art" title="Collage" meta={`${collageCount} pieces`} />
      <ArtCard href="/music" title="Songs" meta={`${songsCount} songs`} />
      <ArtCard href="/videos" title="Videos" meta={`${videosCount} pieces`} />
    </div>
  </>
)
