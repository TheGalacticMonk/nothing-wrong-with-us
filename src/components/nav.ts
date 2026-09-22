/** Fixed site navigation (routes are not editable). Mirrors legacy/astro/src/config/site.ts. */
export interface NavItem {
  label: string
  href: string
  /** Extra paths that should also mark this item as the current section. */
  also?: readonly string[]
}

export const artSections: readonly NavItem[] = [
  { label: 'Collage', href: '/collage-art' },
  { label: 'Songs', href: '/music' },
  { label: 'Videos', href: '/videos' },
]

export const mainNav: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about-me' },
  { label: 'Art', href: '/art', also: artSections.map((s) => s.href) },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
]

export const matchesPath = (path: string, href: string) =>
  path === href || path.startsWith(`${href}/`)

export const isCurrent = (path: string, item: NavItem) =>
  matchesPath(path, item.href) || (item.also?.some((href) => matchesPath(path, href)) ?? false)
