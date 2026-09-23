import type { SiteSetting } from '@/payload-types'
import styles from './CrisisResources.module.css'

type Line = NonNullable<NonNullable<NonNullable<SiteSetting['safety']>['crisis']>['lines']>[number]

/** Render only when `crisisLines(settings)` returned lines (the block can be switched off). */
export const CrisisResources = ({ lines }: { lines: Line[] }) => (
  <section className={styles.crisis} aria-labelledby="crisis-title">
    <h2 id="crisis-title" className="label">
      If you need support right now
    </h2>
    <ul>
      {lines.map((line) => (
        <li key={line.id ?? line.phone}>
          <a href={`tel:${line.phone}`}>{line.how}</a> · {line.name}
        </li>
      ))}
    </ul>
  </section>
)
