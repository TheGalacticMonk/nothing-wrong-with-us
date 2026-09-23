import type { Metadata } from 'next'

import { ArtNav } from '@/components/ArtNav'
import { PageHeader } from '@/components/PageHeader'
import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import section from '../art-section.module.css'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/music', seo: page?.songs?.seo, settings })
}

export default async function MusicPage() {
  const [page, songs] = await Promise.all([getGlobal('art-page'), getCollection('songs')])

  return (
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
}
