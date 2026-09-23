'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { isCurrent, mainNav } from '@/components/nav'
import { QuickExit } from '@/components/QuickExit'
import type { SocialLink } from '@/components/safety'
import { Wordmark } from '@/components/Wordmark'
import styles from './Header.module.css'

interface Props {
  social: (SocialLink & { id?: string | null })[]
  /** Set only when the Quick exit button is switched on in Site Settings. */
  quickExitURL?: string | null
}

const closeOnEscape = (details: HTMLDetailsElement) => (event: KeyboardEvent) => {
  if (event.key === 'Escape' && details.open) {
    details.open = false
    details.querySelector('summary')?.focus()
  }
}

const closeOnClickAway = (details: HTMLDetailsElement) => (event: MouseEvent) => {
  if (details.open && event.target instanceof Node && !details.contains(event.target)) {
    details.open = false
  }
}

export const Header = ({ social, quickExitURL }: Props) => {
  const path = usePathname() || '/'
  const mobileNav = useRef<HTMLDetailsElement>(null)
  const mobileSocial = useRef<HTMLDetailsElement>(null)
  const desktopSocial = useRef<HTMLDetailsElement>(null)

  // The menu works without JS (it is a <details>); this only adds Escape and click-away to close,
  // and closes it when the window grows past the mobile breakpoint.
  useEffect(() => {
    const nav = mobileNav.current
    const dropdown = desktopSocial.current
    const nested = mobileSocial.current
    const cleanups: (() => void)[] = []
    const listen = <K extends keyof DocumentEventMap>(
      type: K,
      handler: (event: DocumentEventMap[K]) => void,
    ) => {
      document.addEventListener(type, handler)
      cleanups.push(() => document.removeEventListener(type, handler))
    }

    if (nav) {
      listen('keydown', closeOnEscape(nav))
      listen('click', closeOnClickAway(nav))
      const query = window.matchMedia('(min-width: 52rem)')
      const onChange = (event: MediaQueryListEvent) => {
        if (event.matches) nav.open = false
      }
      query.addEventListener('change', onChange)
      cleanups.push(() => query.removeEventListener('change', onChange))
    }
    // Same close-on-Escape/click-away for the desktop Social dropdown.
    if (dropdown) {
      listen('keydown', closeOnEscape(dropdown))
      listen('click', closeOnClickAway(dropdown))
    }
    // Collapse the mobile Social list whenever the menu closes, so it doesn't reopen expanded.
    if (nav && nested) {
      const onToggle = () => {
        if (!nav.open) nested.open = false
      }
      nav.addEventListener('toggle', onToggle)
      cleanups.push(() => nav.removeEventListener('toggle', onToggle))
    }
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [])

  // Client-side navigation keeps the header mounted, so close the menus after a page change.
  useEffect(() => {
    if (mobileNav.current) mobileNav.current.open = false
    if (desktopSocial.current) desktopSocial.current.open = false
  }, [path])

  const current = (item: (typeof mainNav)[number]) =>
    isCurrent(path, item) ? ('page' as const) : undefined

  return (
    <header className={`${styles['site-header']} no-print`}>
      <div className={`wrap ${styles.bar}${quickExitURL ? ` ${styles['has-exit']}` : ''}`}>
        <Link href="/" className={styles.home} aria-label="Nothing Wrong With You, home">
          <Wordmark />
        </Link>

        {quickExitURL && (
          <span className={styles.exit}>
            <QuickExit url={quickExitURL} />
          </span>
        )}

        <nav className={styles['desktop-nav']} aria-label="Main">
          <ul>
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="label" aria-current={current(item)}>
                  {item.label}
                </Link>
              </li>
            ))}
            {social.length > 0 && (
              <li>
                <details className={styles['social-dropdown']} ref={desktopSocial}>
                  <summary className="label">Social</summary>
                  <ul className={styles['social-panel']}>
                    {social.map((item) => (
                      <li key={item.id ?? item.url}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            )}
          </ul>
        </nav>

        <details className={styles['mobile-nav']} ref={mobileNav}>
          <summary className={`${styles['menu-btn']} label`}>
            <span>Menu</span>
            <span className={styles.bars} aria-hidden="true">
              <span className={`${styles['bar-list']} ${styles.top}`} />
              <span className={`${styles['bar-list']} ${styles.middle}`} />
              <span className={`${styles['bar-list']} ${styles.bottom}`} />
            </span>
          </summary>
          <nav className={styles['menu-container']} aria-label="Main">
            <ul>
              {mainNav.map((item) => (
                <li key={item.href} className={styles['menu-list']}>
                  <Link href={item.href} aria-current={current(item)}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {social.length > 0 && (
                <li className={`${styles['menu-list']} ${styles['menu-list-social']}`}>
                  <details
                    className={`${styles['social-dropdown']} ${styles['social-dropdown-mobile']}`}
                    ref={mobileSocial}
                  >
                    <summary>Social</summary>
                    <ul className={`${styles['social-panel']} ${styles['social-panel-mobile']}`}>
                      {social.map((item) => (
                        <li key={item.id ?? item.url}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              )}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  )
}
