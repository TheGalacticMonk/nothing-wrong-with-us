import Link from 'next/link'

import { artSections, matchesPath } from '@/components/nav'
import styles from './ArtNav.module.css'

/** `path` is the page it sits on (these pages are fixed, so no client-side lookup is needed). */
export const ArtNav = ({ path }: { path: string }) => (
  <nav className={styles['art-nav']} aria-label="Art sections">
    <ul>
      <li>
        <Link href="/art" className="label" aria-current={path === '/art' ? 'page' : undefined}>
          All art
        </Link>
      </li>
      {artSections.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="label"
            aria-current={matchesPath(path, item.href) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
)
