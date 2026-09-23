/** The four-point star from the site (legacy Star.astro), drawn in the current text colour. */
export const StarPath = () => (
  <path
    fill="currentColor"
    d="M32 2c1.9 16.6 7.4 22.1 30 30-22.6 7.9-28.1 13.4-30 30C30.1 45.4 24.6 39.9 2 32c22.6-7.9 28.1-13.4 30-30z"
  />
)

/** Small icon at the top left of every admin screen; Payload wraps it in a link to the dashboard. */
export default function Icon() {
  return (
    <svg className="nwwy-icon" viewBox="0 0 64 64" role="img" aria-label="Nothing Wrong With You">
      <StarPath />
    </svg>
  )
}
