import { Star } from '@/components/Star'
import styles from './ContentNote.module.css'

/** Render only when `contentNoteText(settings)` returned text (the note can be switched off). */
export const ContentNote = ({ text }: { text: string }) => (
  <aside className={styles.note} role="note" aria-label="Content note">
    <span className={styles.icon}>
      <Star />
    </span>
    <p>
      <strong className="label">Content note</strong>
      <br />
      {text}
    </p>
  </aside>
)
