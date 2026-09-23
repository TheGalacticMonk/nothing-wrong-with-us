import type { ReactNode } from 'react'

import { Star } from '@/components/Star'
import styles from './PageHeader.module.css'

interface Props {
  title?: string | null
  /** Small label above the title. */
  eyebrow?: string | null
  /** Short line under the title. */
  lede?: string | null
  children?: ReactNode
}

export const PageHeader = ({ title, eyebrow, lede, children }: Props) => (
  <header className={`${styles['page-header']} wrap`}>
    {eyebrow && <p className={`label ${styles.eyebrow}`}>{eyebrow}</p>}
    <h1>{title}</h1>
    {lede && <p className={styles.lede}>{lede}</p>}
    {children}
    <span className={`${styles.star} ${styles['star-a']}`}>
      <Star delay={0.4} />
    </span>
    <span className={`${styles.star} ${styles['star-b']}`}>
      <Star delay={1.8} />
    </span>
  </header>
)
