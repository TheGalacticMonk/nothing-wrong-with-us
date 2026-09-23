import { Fragment } from 'react'

import { ContactForm } from '@/components/ContactForm'
import { CrisisResources } from '@/components/CrisisResources'
import { PageHeader } from '@/components/PageHeader'
import { crisisLines, socialLinks } from '@/components/safety'
import { RichText } from '@/lib/richText'
import type { ContactPage as ContactPageData, SiteSetting } from '@/payload-types'
import styles from './page.module.css'

export interface ContactViewProps {
  page: ContactPageData | null | undefined
  settings: SiteSetting | null | undefined
}

/** Pure presentational render of the Contact page. */
export const ContactView = ({ page, settings }: ContactViewProps) => {
  const social = socialLinks(settings)
  const crisis = crisisLines(settings)
  const formspreeId = settings?.contactForm?.formspreeId?.trim()
  const action = formspreeId ? `https://formspree.io/f/${formspreeId}` : null
  const topics = (page?.topics ?? []).map((t) => t.topic).filter(Boolean)
  const addressLines = page?.bookingAddress?.split(/\r?\n/).filter((line) => line.trim()) ?? []

  return (
    <>
      <PageHeader eyebrow={page?.eyebrow} title={page?.heading} lede={page?.lede} />

      <div className={`wrap ${styles.layout}`}>
        <div className={styles.info}>
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className={`label ${styles.heading}`}>
              About
            </h2>
            <div className="prose">
              <RichText data={page?.about} />
            </div>
          </section>

          {social.length > 0 && (
            <section aria-labelledby="follow-heading">
              <h2 id="follow-heading" className={`label ${styles.heading}`}>
                Follow
              </h2>
              <ul className={styles.social}>
                {social.map((item) => (
                  <li key={item.id ?? item.url}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(addressLines.length > 0 || page?.bookingHint) && (
            <section aria-labelledby="booking-heading">
              <h2 id="booking-heading" className={`label ${styles.heading}`}>
                Booking + Press
              </h2>
              {addressLines.length > 0 && (
                <address className={styles.address}>
                  {addressLines.map((line, i) => (
                    <Fragment key={i}>
                      {i > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </address>
              )}
              {page?.bookingHint && <p className={styles.hint}>{page.bookingHint}</p>}
            </section>
          )}

          {crisis && <CrisisResources lines={crisis} />}
        </div>

        <div className={`on-paper paper wave-top wave-bottom ${styles['form-panel']}`}>
          <ContactForm action={action} topics={topics} />
        </div>
      </div>
    </>
  )
}
