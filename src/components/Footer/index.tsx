import Link from 'next/link'
import { Fragment } from 'react'

import { artSections, mainNav } from '@/components/nav'
import { crisisLines, legalNoticeText, socialLinks } from '@/components/safety'
import { Star } from '@/components/Star'
import { Wordmark } from '@/components/Wordmark'
import { siteName } from '@/lib/seo'
import type { SiteSetting } from '@/payload-types'
import styles from './Footer.module.css'

export const Footer = ({ settings }: { settings: SiteSetting | null }) => {
  const year = new Date().getFullYear()
  const social = socialLinks(settings)
  const crisis = crisisLines(settings)
  const legal = legalNoticeText(settings)

  return (
    <footer className={`${styles.footer} no-print`}>
      <div className="wrap">
        <div className={styles.top}>
          <div>
            <p className={styles.mark}>
              <Wordmark />
            </p>
            {settings?.tagline && <p className={styles.tagline}>{settings.tagline}.</p>}
          </div>

          <nav aria-label="Explore">
            <h2 className="label">Explore</h2>
            <ul>
              {mainNav.map((item) => (
                <Fragment key={item.href}>
                  <li>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                  {item.href === '/art' &&
                    artSections.map((sub) => (
                      <li key={sub.href} className={styles.sub}>
                        <Link href={sub.href}>{sub.label}</Link>
                      </li>
                    ))}
                </Fragment>
              ))}
            </ul>
          </nav>

          {social.length > 0 && (
            <nav aria-label="Follow">
              <h2 className="label">Follow</h2>
              <ul>
                {social.map((item) => (
                  <li key={item.id ?? item.url}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {crisis && (
            <section aria-labelledby="support-heading">
              <h2 id="support-heading" className="label">
                If you need support now
              </h2>
              <ul>
                {crisis.map((line) => (
                  <li key={line.id ?? line.phone}>
                    <a href={`tel:${line.phone}`}>{line.how}</a>
                    <span className={styles.who}>{line.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className={styles.bottom}>
          <span className={styles.dot}>
            <Star />
          </span>
          {legal && <p>{legal}</p>}
          <p>
            &copy; {year} {siteName(settings)}
          </p>
        </div>
      </div>
    </footer>
  )
}
