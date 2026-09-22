import Link from 'next/link'

import styles from './ArtCard.module.css'

interface Props {
  href: string
  title: string
  meta: string
  blurb?: string
}

export const ArtCard = ({ href, title, meta, blurb }: Props) => (
  <Link href={href} className={`${styles.card} reveal`}>
    <span className={styles.title}>{title}</span>
    <span className={`${styles.meta} label`}>{meta}</span>
    {blurb && <span className={styles.blurb}>{blurb}</span>}
  </Link>
)
