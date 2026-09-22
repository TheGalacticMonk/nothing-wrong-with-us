import Link from 'next/link'

import { artSections, mainNav } from '@/components/nav'
import { PageHeader } from '@/components/PageHeader'
import styles from './not-found.module.css'

const links = [...mainNav, ...artSections]

/** Styled 404 (same as legacy/astro/src/pages/404.astro). Metadata: see [...notFound]/page.tsx. */
export default function NotFound() {
  return (
    <>
      <PageHeader eyebrow="404" title="Page not found" />
      <div className="wrap">
        <p>
          <Link className="btn" href="/">
            Back to the home page
          </Link>
        </p>
        <ul className={styles.links}>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
