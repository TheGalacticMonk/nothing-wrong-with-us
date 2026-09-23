import { ArtNav } from '@/components/ArtNav'
import { PageHeader } from '@/components/PageHeader'
import type { ArtPage as ArtPageData, Song } from '@/payload-types'
import section from '../art-section.module.css'
import styles from './page.module.css'

export interface MusicPageViewProps {
  page: ArtPageData | null | undefined
  songs: Song[]
}

/** Pure presentational render of the Music (Songs) page. */
export const MusicPageView = ({ page, songs }: MusicPageViewProps) => (
  <>
    <PageHeader eyebrow="Art" title={page?.songs?.heading}>
      <div className={section.nav}>
        <ArtNav path="/music" />
      </div>
    </PageHeader>

    <div className={`wrap ${styles.body}`}>
      {page?.songs?.intro && <p className={styles.intro}>{page.songs.intro}</p>}
      <ul className={styles.tracks}>
        {songs
          .filter((song) => song.url)
          .map((song) => (
            <li key={song.id} className={`${styles.track} reveal`}>
              <div className={styles.meta}>
                <h2 className={styles.title}>{song.title}</h2>
                <p className="label">
                  {song.artist}
                  {song.duration && (
                    <>
                      {' · '}
                      <span>{song.duration}</span>
                    </>
                  )}
                </p>
              </div>
              <audio className={styles.audio} controls preload="none" src={song.url ?? undefined}>
                <a href={song.url ?? undefined}>Download “{song.title}” (MP3)</a>
              </audio>
            </li>
          ))}
      </ul>
    </div>
  </>
)
