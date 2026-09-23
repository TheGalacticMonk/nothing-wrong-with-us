import type { ReactNode } from 'react'

import { fraunces } from './fonts'

/**
 * Admin provider (admin.components.providers). Loads the site's display font once and
 * exposes it as --font-admin-display so custom.scss can use it on the wordmark and headings,
 * including inside modals, which render outside the provider tree.
 */
export default function BrandFonts({ children }: { children?: ReactNode }) {
  return (
    <>
      <style href="nwwy-admin-fonts" precedence="default">
        {`:root{--font-admin-display:${fraunces.style.fontFamily};}`}
      </style>
      {children}
    </>
  )
}
