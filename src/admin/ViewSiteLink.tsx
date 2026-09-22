import { siteURL } from '@/lib/paths'

/** Shown at the bottom of the side menu (admin.components.afterNavLinks) on every screen. */
export default function ViewSiteLink() {
  return (
    <a className="nwwy-nav-site" href={siteURL} target="_blank" rel="noopener noreferrer">
      View your website
      <span aria-hidden="true"> ↗</span>
      <span className="nwwy-visually-hidden"> (opens in a new tab)</span>
    </a>
  )
}
