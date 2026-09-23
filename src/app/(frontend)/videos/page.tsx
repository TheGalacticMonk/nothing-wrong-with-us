import type { Metadata } from 'next'

import { ArtNav } from '@/components/ArtNav'
import { ContentNote } from '@/components/ContentNote'
import { asUpload, imageSource } from '@/components/media'
import { PageHeader } from '@/components/PageHeader'
import { contentNoteText } from '@/components/safety'
import { YouTubeFacade } from '@/components/YouTubeFacade'
import { getCollection, getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { parseYouTubeId } from '@/lib/youtube'
import section from '../art-section.module.css'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('art-page'), getSiteSettings()])
  return pageMetadata({ path: '/videos', seo: page?.videos?.seo, settings })
}

/** Cover image from the CMS if set, else YouTube's own thumbnail (fetched via the image optimiser). */
const posterFor = (id: string, poster: Parameters<typeof asUpload>[0]) => {
  const upload = asUpload(poster)
  return upload
    ? imageSource(upload)
    : { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 }
}

export default async function VideosPage() {
  const [page, settings, videos] = await Promise.all([
    getGlobal('art-page'),
    getSiteSettings(),
    getCollection('videos'),
  ])
  const note = contentNoteText(settings)
  const items = videos.flatMap((video) => {
    const id = video.youtubeUrl ? parseYouTubeId(video.youtubeUrl) : null
    return id ? [{ ...video, youtubeId: id }] : []
  })

  return (
    <>
      <PageHeader eyebrow="Art" title={page?.videos?.heading} lede={page?.videos?.lede}>
        <div className={section.nav}>
          <ArtNav path="/videos" />
        </div>
        {note && (
          <div className={section.nav}>
            <ContentNote text={note} />
          </div>
        )}
      </PageHeader>

      <div className="wrap">
        <ul className={styles.grid}>
          {items.map((video) => (
            <li key={video.id} className="reveal">
              <YouTubeFacade
                id={video.youtubeId}
                title={video.title}
                poster={posterFor(video.youtubeId, video.poster)}
              />
              <h2 className={styles.title}>{video.title}</h2>
              {video.description && <p className={styles.description}>{video.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
