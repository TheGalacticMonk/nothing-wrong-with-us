import type { Payload, SanitizedPermissions, TypedUser } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { siteURL } from '@/lib/paths'

import { icons, type IconName } from './icons'

type Props = {
  payload: Payload
  permissions: SanitizedPermissions
  user?: TypedUser | null
}

type Task = {
  title: string
  text: string
  icon: IconName
  href: string
  allowed: boolean
  external?: boolean
  more?: { href: string; label: string }
}

const firstName = (user?: TypedUser | null) => {
  const name = user && 'name' in user && typeof user.name === 'string' ? user.name.trim() : ''
  return name.split(/\s+/)[0] || ''
}

/**
 * The dashboard: a greeting, the common jobs as large cards, and a short note on how
 * publishing works. Rendered by ./Dashboard for every signed-in person.
 */
export default async function Welcome({ payload, permissions, user }: Props) {
  const adminRoute = payload.config.routes.admin
  const url = (path: `/${string}`) => formatAdminURL({ adminRoute, path })
  const canEditPage = (slug: string) => Boolean(permissions?.globals?.[slug]?.update)
  const canAdd = (slug: string) => Boolean(permissions?.collections?.[slug]?.create)

  const page = (slug: string, title: string, text: string, icon: IconName): Task => ({
    title,
    text,
    icon,
    href: url(`/globals/${slug}`),
    allowed: canEditPage(slug),
  })

  const add = (slug: string, title: string, text: string, icon: IconName, moreLabel: string): Task => ({
    title,
    text,
    icon,
    href: url(`/collections/${slug}/create`),
    allowed: canAdd(slug),
    more: { href: url(`/collections/${slug}`), label: moreLabel },
  })

  const sections: { heading: string; tasks: Task[] }[] = [
    {
      heading: 'Edit a page',
      tasks: [
        page('home-page', 'Edit the Home page', 'The first page visitors see.', 'home'),
        page('about-page', 'Edit About', 'Your story and portrait.', 'person'),
        page('resources-page', 'Edit Resources', 'Definitions, documents and helpful links.', 'book'),
        page('contact-page', 'Edit Contact', 'Contact details and the message form.', 'mail'),
        page('art-page', 'Edit the Art pages', 'Headings and intros for Art, Collage, Songs and Videos.', 'palette'),
      ],
    },
    {
      heading: 'Add your art',
      tasks: [
        add('collage', 'Add a collage piece', 'Upload a picture to the Collage gallery.', 'image', 'See all pieces or reorder'),
        add('songs', 'Add a song', 'Upload a song to the Songs page.', 'music', 'See all songs or reorder'),
        add('videos', 'Add a video', 'Paste a YouTube link for the Videos page.', 'video', 'See all videos or reorder'),
      ],
    },
    {
      heading: 'The whole site',
      tasks: [
        page(
          'site-settings',
          'Site settings & support messages',
          'Site name, social links, crisis lines and the content note. Goes live when you press Save.',
          'settings',
        ),
        {
          title: 'View your website',
          text: 'Opens the live site in a new tab.',
          icon: 'external',
          href: siteURL,
          allowed: true,
          external: true,
        },
      ],
    },
  ]

  const name = firstName(user)
  const recent = await recentEdits(payload, user, url)

  return (
    <div className="nwwy-welcome">
      <header className="nwwy-welcome__header">
        <h1 className="nwwy-welcome__title">{name ? `Hello, ${name}.` : 'Hello.'}</h1>
        <p className="nwwy-welcome__lede">What would you like to work on today?</p>
      </header>

      {sections.map(({ heading, tasks }) => {
        const visible = tasks.filter((t) => t.allowed)
        if (visible.length === 0) return null
        return (
          <section key={heading} className="nwwy-welcome__section" aria-label={heading}>
            <h2 className="nwwy-welcome__section-title">{heading}</h2>
            <ul className="nwwy-cards">
              {visible.map((task) => (
                <li key={task.title} className="nwwy-card">
                  <span className="nwwy-card__icon">{icons[task.icon]}</span>
                  <a
                    className="nwwy-card__link"
                    href={task.href}
                    {...(task.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {task.title}
                    {task.external && <span className="nwwy-visually-hidden"> (opens in a new tab)</span>}
                  </a>
                  <p className="nwwy-card__text">{task.text}</p>
                  {task.more && (
                    <a className="nwwy-card__more" href={task.more.href}>
                      {task.more.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <div className="nwwy-welcome__columns">
        <section className="nwwy-note" aria-labelledby="nwwy-how">
          <h2 id="nwwy-how" className="nwwy-note__title">
            How publishing works
          </h2>
          <ol className="nwwy-note__steps">
            <li>
              <strong>Your edits are kept as a draft.</strong> Pages save the draft by themselves as you type; nobody
              sees it yet.
            </li>
            <li>
              <strong>The preview beside the editor</strong> shows exactly how your changes will look.
            </li>
            <li>
              <strong>Press “Publish changes”</strong> to put them live. The website updates within seconds.
            </li>
          </ol>
        </section>

        {recent.length > 0 && (
          <section className="nwwy-note" aria-labelledby="nwwy-recent">
            <h2 id="nwwy-recent" className="nwwy-note__title">
              Recently edited
            </h2>
            <ul className="nwwy-recent">
              {recent.map((item) => (
                <li key={item.href + item.when}>
                  <a href={item.href}>{item.title}</a>
                  <span className="nwwy-recent__when">{item.ago}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

type Recent = { title: string; href: string; when: number; ago: string }

const pageNames: Record<string, string> = {
  'home-page': 'Home page',
  'about-page': 'About page',
  'art-page': 'Art pages',
  'resources-page': 'Resources page',
  'contact-page': 'Contact page',
  'site-settings': 'Site settings',
}

const itemKinds = [
  { slug: 'collage', kind: 'Collage piece', titleField: 'alt' },
  { slug: 'songs', kind: 'Song', titleField: 'title' },
  { slug: 'videos', kind: 'Video', titleField: 'title' },
] as const

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const timeAgo = (then: number) => {
  const seconds = Math.round((then - Date.now()) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

/** The last few things anyone changed, newest first. Never breaks the dashboard. */
async function recentEdits(
  payload: Payload,
  user: TypedUser | null | undefined,
  url: (path: `/${string}`) => string,
): Promise<Recent[]> {
  if (!user) return []
  try {
    const results = await Promise.all([
      ...Object.entries(pageNames).map(async ([slug, title]) => {
        const doc = await payload.findGlobal({
          slug: slug as 'home-page',
          depth: 0,
          draft: true,
          overrideAccess: false,
          user,
        })
        const when = doc?.updatedAt ? Date.parse(doc.updatedAt) : NaN
        return Number.isNaN(when) ? [] : [{ title, href: url(`/globals/${slug}`), when }]
      }),
      ...itemKinds.map(async ({ slug, kind, titleField }) => {
        const { docs } = await payload.find({
          collection: slug,
          depth: 0,
          draft: true,
          limit: 3,
          sort: '-updatedAt',
          overrideAccess: false,
          user,
        })
        return docs.map((doc) => {
          const label = String((doc as unknown as Record<string, unknown>)[titleField] || '').trim()
          return {
            title: label ? `${kind}: ${label}` : kind,
            href: url(`/collections/${slug}/${doc.id}`),
            when: Date.parse(doc.updatedAt),
          }
        })
      }),
    ])
    return results
      .flat()
      .sort((a, b) => b.when - a.when)
      .slice(0, 5)
      .map((item) => ({ ...item, ago: timeAgo(item.when) }))
  } catch (error) {
    payload.logger.warn({ err: error, msg: 'Dashboard: could not load recent edits' })
    return []
  }
}
