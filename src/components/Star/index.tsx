import type { CSSProperties } from 'react'

import styles from './Star.module.css'

interface Props {
  className?: string
  /** Seconds. Staggers the twinkle so a group of stars doesn't pulse in unison. */
  delay?: number
}

/** Decorative four-point star. Size it with a wrapper element (the svg fills its width). */
export const Star = ({ className, delay = 0 }: Props) => (
  <svg
    className={['twinkle', styles.star, className].filter(Boolean).join(' ')}
    style={{ '--twinkle-delay': `${delay}s` } as CSSProperties}
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
    fill="currentColor"
  >
    <path d="M32 2c1.9 16.6 7.4 22.1 30 30-22.6 7.9-28.1 13.4-30 30C30.1 45.4 24.6 39.9 2 32c22.6-7.9 28.1-13.4 30-30z" />
  </svg>
)
