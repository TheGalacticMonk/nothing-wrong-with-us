import Image from 'next/image'
import Link from 'next/link'

import { asUpload, imageSource } from '@/components/media'
import { Star } from '@/components/Star'
import { homeJsonLd, siteName } from '@/lib/seo'
import type { Collage, HomePage as HomePageData, SiteSetting } from '@/payload-types'
import styles from './page.module.css'

/** The three pieces shown on the "Look" door (as on the Astro site), else the first three. */
const DOOR_TILES = ['collage-11', 'collage-19', 'collage-03']
const doorTiles = (collage: Collage[]) => {
  const withImage = collage.filter((c) => asUpload(c))
  const picked = DOOR_TILES.map((name) =>
    withImage.find((c) => c.filename?.replace(/\.[^.]+$/, '') === name),
  ).filter((c): c is Collage => Boolean(c))
  for (const c of withImage) {
    if (picked.length >= 3) break
    if (!picked.includes(c)) picked.push(c)
  }
  return picked.slice(0, 3)
}

type Button = HomePageData['primaryButton'] | null | undefined
const hasButton = (button: Button): button is NonNullable<Button> =>
  Boolean(button?.text && button.page)

/** "Magic. Art. Truth." → the last word is set in italic pink. */
const splitLastWord = (text: string) => {
  const at = text.trimEnd().lastIndexOf(' ')
  return at === -1 ? ['', text] : [text.slice(0, at + 1), text.slice(at + 1)]
}

export interface HomeViewProps {
  home: HomePageData | null | undefined
  settings: SiteSetting | null | undefined
  collage: Collage[]
  songsCount: number
  videosCount: number
}

/**
 * Pure presentational render of the Home page. Takes fully-resolved data as props so it can be
 * rendered either straight from the server (public visitors) or from `HomeLive` inside the Live
 * Preview iframe (editors) without duplicating markup.
 */
export const HomeView = ({ home, settings, collage, songsCount, videosCount }: HomeViewProps) => {
  const hero = asUpload(home?.heroImage)
  const portrait = asUpload(home?.storyPortrait)
  const stanzas = (home?.stanzas ?? []).filter((s) => s.line)
  const tiles = doorTiles(collage)
  // "Nothing Wrong With You": one word per line, the last two words in italic pink.
  const words = siteName(settings).split(/\s+/)
  const titleWords = words.slice(0, -2)
  const titleEmphasis = words.slice(-2).join(' ')
  const [wordsStart, wordsLast] = home?.closingWords ? splitLastWord(home.closingWords) : ['', '']

  return (
    <>
      {homeJsonLd(settings).map((node) => (
        <script
          key={String(node['@type'])}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node).replace(/</g, '\\u003c') }}
        />
      ))}

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles['hero-art']}>
          {hero && (
            <Image
              {...imageSource(hero)}
              alt={hero.alt ?? ''}
              sizes="(min-width: 64rem) 58vw, 100vw"
              quality={45}
              loading="eager"
              fetchPriority="high"
            />
          )}
        </div>

        <div className={`wrap ${styles['hero-copy']}`}>
          {home?.eyebrow && <p className={`label ${styles.eyebrow}`}>{home.eyebrow}</p>}
          <h1 id="hero-title">
            {titleWords.map((word, i) => (
              <span key={i}>{word}</span>
            ))}
            <em>{titleEmphasis}</em>
          </h1>
          {settings?.tagline && <p className={styles.tagline}>{settings.tagline}.</p>}
          <div className={styles.cta}>
            {hasButton(home?.primaryButton) && (
              <Link className="btn" href={home.primaryButton.page}>
                {home.primaryButton.text}
              </Link>
            )}
            {hasButton(home?.secondaryButton) && (
              <Link className="btn btn-ghost" href={home.secondaryButton.page}>
                {home.secondaryButton.text}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className={`${styles.manifesto} section-space`} aria-label="A message to survivors">
        <div className="wrap">
          {home?.leadIn && <p className={`label ${styles['lead-in']} reveal`}>{home.leadIn}</p>}
          <ul className={styles.stanzas}>
            {stanzas.map((stanza, i) => (
              <li
                key={stanza.id ?? i}
                className={`${styles.stanza} reveal${i === stanzas.length - 1 ? ` ${styles.last}` : ''}`}
              >
                {stanza.line}
              </li>
            ))}
          </ul>
          <span className={`${styles['m-star']} ${styles['m-a']}`} aria-hidden="true">
            <Star delay={0.3} />
          </span>
          <span className={`${styles['m-star']} ${styles['m-b']}`} aria-hidden="true">
            <Star delay={2.1} />
          </span>
          {home?.closingLine && (
            <p className={`${styles['for-the-ones']} reveal`}>{home.closingLine}</p>
          )}
        </div>
      </section>

      <section
        className={`${styles.story} on-paper paper wave-top wave-bottom`}
        aria-labelledby="story-title"
      >
        <div className={`wrap ${styles['story-grid']}`}>
          <figure className={`${styles.portrait} reveal`}>
            {portrait && (
              <Image
                {...imageSource(portrait)}
                alt={portrait.alt ?? ''}
                sizes="(min-width: 52rem) 30rem, 80vw"
                quality={80}
              />
            )}
          </figure>
          <div className={styles['story-copy']}>
            <h2 id="story-title" className={`label ${styles['eyebrow-dark']}`}>
              About Becca
            </h2>
            {home?.storyQuote && (
              <blockquote className={`${styles.pull} reveal`}>
                <p>{home.storyQuote}</p>
              </blockquote>
            )}
            {home?.storyText && <p className={`${styles.body} reveal`}>{home.storyText}</p>}
            {hasButton(home?.storyButton) && (
              <p className="reveal">
                <Link className="btn" href={home.storyButton.page}>
                  {home.storyButton.text}
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${styles.doors} section-space`} aria-labelledby="doors-title">
        <div className="wrap">
          <h2 id="doors-title" className={`label ${styles['door-heading']}`}>
            {home?.doorsHeading}
          </h2>
          <div className={styles['door-grid']}>
            <Link className={`${styles.door} ${styles['door-collage']} reveal`} href="/collage-art">
              <span className={styles['door-title']}>{home?.collageDoor}</span>
              <span className={styles['door-meta']}>{collage.length} collages</span>
              <span className={styles.stack} aria-hidden="true">
                {tiles.map((tile, i) => (
                  <Image
                    key={tile.id}
                    {...imageSource(tile)}
                    alt=""
                    sizes="(min-width: 52rem) 12rem, 30vw"
                    className={`${styles['stack-img']} ${styles[`stack-${i}`]}`}
                  />
                ))}
              </span>
            </Link>
            <Link className={`${styles.door} ${styles['door-songs']} reveal`} href="/music">
              <span className={styles['door-title']}>{home?.songsDoor}</span>
              <span className={styles['door-meta']}>{songsCount} songs</span>
            </Link>
            <Link className={`${styles.door} ${styles['door-videos']} reveal`} href="/videos">
              <span className={styles['door-title']}>{home?.videosDoor}</span>
              <span className={styles['door-meta']}>{videosCount} video pieces</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.closing} section-space`} aria-labelledby="closing-title">
        <div className="wrap">
          <h2 id="closing-title" className="reveal">
            {home?.closingHeading}
          </h2>
          {home?.closingText && <p className="reveal">{home.closingText}</p>}
          {home?.closingWords && (
            <p className={`${styles.triad} reveal`}>
              {wordsStart}
              <em>{wordsLast}</em>
            </p>
          )}
          {hasButton(home?.closingButton) && (
            <p className="reveal">
              <Link className="btn" href={home.closingButton.page}>
                {home.closingButton.text}
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  )
}
