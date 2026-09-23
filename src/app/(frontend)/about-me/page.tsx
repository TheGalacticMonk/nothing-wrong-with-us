import type { Metadata } from 'next'
import Image from 'next/image'

import { ContentNote } from '@/components/ContentNote'
import { asUpload, imageSource } from '@/components/media'
import { contentNoteText } from '@/components/safety'
import { getGlobal, getSiteSettings } from '@/lib/content'
import { isExternal, RichText } from '@/lib/richText'
import { pageMetadata } from '@/lib/seo'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('about-page'), getSiteSettings()])
  return pageMetadata({ path: '/about-me', seo: page?.seo, settings })
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getGlobal('about-page'), getSiteSettings()])
  const portrait = asUpload(page?.portrait)
  const affirmations = (page?.affirmations ?? []).filter((a) => a.line)
  const note = contentNoteText(settings)
  const external = page?.connectUrl ? isExternal(page.connectUrl) : false

  return (
    <>
      <header className={`wrap ${styles.intro}`}>
        {page?.eyebrow && <p className={`label ${styles.eyebrow}`}>{page.eyebrow}</p>}
        <h1>
          {page?.heading}
          {page?.heading && page?.headingEmphasis && ' '}
          {page?.headingEmphasis && <em>{page.headingEmphasis}</em>}
        </h1>
        {page?.lede && <p className={styles.lede}>{page.lede}</p>}
        {affirmations.length > 0 && (
          <ul className={styles.chants}>
            {affirmations.map((a, i) => (
              <li
                key={a.id ?? i}
                className={i === affirmations.length - 1 ? styles.strong : undefined}
              >
                {a.line}
              </li>
            ))}
          </ul>
        )}
        {(page?.connectText || page?.connectLabel) && (
          <p className={styles.connect}>
            {page.connectText}
            {page.connectLabel && page.connectUrl && (
              <>
                {' '}
                <a
                  href={page.connectUrl}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                >
                  {page.connectLabel}
                </a>
              </>
            )}
          </p>
        )}
        {note && (
          <div className={styles.note}>
            <ContentNote text={note} />
          </div>
        )}
      </header>

      <div className={`wrap ${styles.layout}`}>
        <figure className={styles.portrait}>
          {portrait && (
            <Image
              {...imageSource(portrait)}
              alt={portrait.alt ?? ''}
              sizes="(min-width: 64rem) 26rem, 90vw"
              quality={80}
              loading="eager"
            />
          )}
        </figure>
        <article className={`on-paper paper wave-top wave-bottom ${styles.panel}`}>
          <div className="prose">
            <RichText data={page?.body} />
          </div>
        </article>
      </div>
    </>
  )
}
