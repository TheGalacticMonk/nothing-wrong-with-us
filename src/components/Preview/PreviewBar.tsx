'use client'

import { usePathname } from 'next/navigation'

import styles from './PreviewBar.module.css'

/** Small notice shown only in draft mode, with a way back to the published version of the page. */
export const PreviewBar = () => {
  const path = usePathname() || '/'
  return (
    <div className={`${styles.bar} no-print`} role="status">
      <span className="label">Preview mode</span>
      <a className="label" href={`/next/exit-preview?path=${encodeURIComponent(path)}`}>
        Exit
      </a>
    </div>
  )
}
