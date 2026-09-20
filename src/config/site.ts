/** Single source of truth for site-wide facts. Edit here, not in components. */

export const site = {
  name: 'Nothing Wrong With You',
  tagline: 'You Can Save Yourself',
  /** Keep in sync with `site` in astro.config.mjs. */
  url: 'https://www.nothingwrongwithyou.org',
  owner: 'Becca Berry',
  locale: 'en_US',
  defaultDescription:
    'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq.',
} as const;

/**
 * Public path for the current page. With `build.format: 'file'`, `Astro.url.pathname` can carry a
 * `.html` suffix at build time; the site is served at clean URLs, so strip it.
 */
export const publicPath = (pathname: string): string =>
  pathname.replace(/(?:\/index)?\.html$/, '') || '/';

export interface NavItem {
  label: string;
  href: string;
  /** Extra paths that should also mark this item as the current section. */
  also?: readonly string[];
}

export const artSections: readonly NavItem[] = [
  { label: 'Collage', href: '/collage-art' },
  // Blog hidden for now. Restore together with src/pages/_blog -> src/pages/blog.
  // { label: 'Blog', href: '/blog' },
  { label: 'Songs', href: '/music' },
  { label: 'Videos', href: '/videos' },
];

export const mainNav: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about-me' },
  { label: 'Art', href: '/art', also: artSections.map((s) => s.href) },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
];

export const social = [
  { label: 'Instagram (personal)', href: 'https://www.instagram.com/beccaberry' },
  { label: 'Instagram (art)', href: 'https://www.instagram.com/nothingwrongwithus' },
  { label: 'Facebook', href: 'https://www.facebook.com/nothingwrongwithyouorg/' },
  { label: 'Twitter', href: 'https://twitter.com/mksurvivor' },
] as const;

export const featuredMedia = {
  video: 'https://www.youtube.com/watch?t=15s&v=xayXIaq3V4M',
  podcast:
    'https://podcasters.spotify.com/pod/show/bobo-matjila/episodes/i-was-raised-by-a-narcissist-ekm068',
} as const;

/**
 * NEW COPY, NOT FROM THE ORIGINAL SITE. Pending client approval before launch.
 * Remove the corresponding component usage if the client declines.
 */
export const safety = {
  contentNote:
    'Some of what is shared here discusses abuse and other trauma. Take breaks, and leave whenever you need to.',
  quickExitUrl: 'https://www.google.com/',
  crisis: [
    { name: '988 Suicide & Crisis Lifeline (US)', how: 'Call or text 988', href: 'tel:988' },
    {
      name: 'RAINN National Sexual Assault Hotline (US)',
      how: 'Call 1-800-656-4673',
      href: 'tel:+18006564673',
    },
  ],
  legalNotice:
    'This site is for education and creative expression. Nothing here is legal advice, and visiting it does not create an attorney-client relationship.',
} as const;

/** Formspree form ID, set via PUBLIC_FORMSPREE_ID. Public identifier, not a secret. */
export const formspreeId: string | undefined = import.meta.env.PUBLIC_FORMSPREE_ID || undefined;
