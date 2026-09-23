import styles from './Wordmark.module.css'

/**
 * The site title, set as type. "With You" turns italic and orchid so the phrase
 * reads as a statement of fact rather than a label.
 */
export const Wordmark = () => (
  <span className={styles.wordmark}>
    Nothing Wrong <em>With You</em>
  </span>
)
