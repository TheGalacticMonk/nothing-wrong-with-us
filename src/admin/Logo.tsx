import { StarPath } from './Icon'

/**
 * Login screen logo: the site wordmark, set like legacy Wordmark.astro
 * (Fraunces bold, with "With You" in italic orchid), plus a one-line welcome.
 */
export default function Logo() {
  return (
    <div className="nwwy-logo">
      <svg className="nwwy-logo__star" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <StarPath />
      </svg>
      <p className="nwwy-logo__wordmark">
        Nothing Wrong <em>With You</em>
      </p>
      <p className="nwwy-logo__hint">Log in to update your website.</p>
    </div>
  )
}
