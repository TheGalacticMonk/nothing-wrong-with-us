import { ContentNote } from '@/components/ContentNote'
import { CrisisResources } from '@/components/CrisisResources'
import { PageHeader } from '@/components/PageHeader'
import { contentNoteText, crisisLines } from '@/components/safety'
import { RichText } from '@/lib/richText'
import type { ResourcesPage as ResourcesPageData, SiteSetting } from '@/payload-types'
import styles from './page.module.css'

export interface ResourcesViewProps {
  page: ResourcesPageData | null | undefined
  settings: SiteSetting | null | undefined
}

/** Pure presentational render of the Resources page. */
export const ResourcesView = ({ page, settings }: ResourcesViewProps) => {
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
