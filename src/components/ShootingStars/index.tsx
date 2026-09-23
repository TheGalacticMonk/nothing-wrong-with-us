import styles from './ShootingStars.module.css'

/**
 * Decorative only: six pink shooting stars streaking down-left behind the page.
 * Hidden entirely for reduced-motion and print.
 */
export const ShootingStars = () => (
  <div className={`${styles['shooting-stars']} no-print`} aria-hidden="true">
    {(['s1', 's2', 's3', 's4', 's5', 's6'] as const).map((s) => (
      <span key={s} className={`${styles['shooting-star']} ${styles[s]}`} />
    ))}
  </div>
)
