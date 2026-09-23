import { describe, expect, it } from 'vitest'

import { safePath } from '@/app/next/safePath'
import { contentNoteText, crisisLines, quickExitURL, socialLinks } from '@/components/safety'
import { parseYouTubeId } from '@/lib/youtube'
import { pageMetadata } from '@/lib/seo'
import type { SiteSetting } from '@/payload-types'

describe('safePath (preview redirect target)', () => {
  it.each(['/', '/about-me', '/collage-art?x=1'])('accepts %s', (p) => expect(safePath(p)).toBe(p))
  it.each([
    null,
    '',
    'about-me',
    '//evil.example',
    'https://evil.example',
    '/\\evil.example',
    // Browsers strip TAB/LF/CR from URLs, so these become "//evil.example" (open redirect).
    '/\t/evil.example',
    '/\n/evil.example',
    '/\r/evil.example',
    '\t//evil.example',
  ])('rejects %j', (p) => expect(safePath(p as string | null)).toBeNull())
})

describe('parseYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('%s', (url, id) => expect(parseYouTubeId(url)).toBe(id))
  it.each(['https://vimeo.com/123', 'not a link', 'https://www.youtube.com/watch?v=<script>'])('rejects %s', (url) => {
    const id = parseYouTubeId(url)
    expect(id === null || /^[\w-]{11}$/.test(id)).toBe(true)
  })
})

describe('support messages', () => {
  const s = {
    safety: {
      contentNote: { enabled: false, text: 'x' },
      crisis: { enabled: true, lines: [{ name: 'a', how: 'b', phone: '988' }] },
      quickExit: { enabled: false, url: 'https://www.google.com/' },
    },
    social: [{ label: 'A', url: 'https://a' }, { label: '', url: 'https://b' }],
  } as unknown as SiteSetting
  it('switches off', () => {
    expect(contentNoteText(s)).toBeNull()
    expect(quickExitURL(s)).toBeNull()
    expect(crisisLines(s)).toHaveLength(1)
    expect(socialLinks(s)).toHaveLength(1)
  })
})

describe('pageMetadata', () => {
  const settings = { siteName: 'Nothing Wrong With You', tagline: 'You Can Save Yourself' } as SiteSetting
  it('home: title pattern and canonical with trailing slash (as legacy + sitemap)', () => {
    const m = pageMetadata({ path: '/', settings, isHome: true })
    expect(m.title).toEqual({ absolute: 'Nothing Wrong With You: You Can Save Yourself' })
    expect(m.alternates?.canonical).toBe('https://www.nothingwrongwithyou.org/')
  })
  it('inner page title + canonical', () => {
    const m = pageMetadata({ path: '/about-me', seo: { title: 'About Me' }, settings })
    expect(m.title).toEqual({ absolute: 'About Me — Nothing Wrong With You' })
    expect(m.alternates?.canonical).toBe('https://www.nothingwrongwithyou.org/about-me')
  })
})
