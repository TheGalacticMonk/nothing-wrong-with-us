import type { Metadata } from 'next'

import { ContentNote } from '@/components/ContentNote'
import { CrisisResources } from '@/components/CrisisResources'
import { PageHeader } from '@/components/PageHeader'
import { contentNoteText, crisisLines } from '@/components/safety'
import { getGlobal, getSiteSettings } from '@/lib/content'
import { RichText } from '@/lib/richText'
import { pageMetadata } from '@/lib/seo'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('resources-page'), getSiteSettings()])
  return pageMetadata({ path: '/resources', seo: page?.seo, settings })
}

export default async function ResourcesPage() {
  const [page, settings] = await Promise.all([getGlobal('resources-page'), getSiteSettings()])
  const note = contentNoteText(settings)
  const crisis = crisisLines(settings)

  return (
    <>
      <PageHeader eyebrow="Resources" title={page?.heading}>
        {note && (
          <div className={styles.stack}>
            <ContentNote text={note} />
          </div>
        )}
        {crisis && (
          <div className={styles.stack}>
            <CrisisResources lines={crisis} />
          </div>
        )}
      </PageHeader>

      <div className="wrap">
        <div className={`on-paper paper wave-top wave-bottom ${styles.panel}`}>
          <div className="prose">
            <RichText data={page?.body} />
          </div>
        </div>
      </div>
    </>
  )
}
