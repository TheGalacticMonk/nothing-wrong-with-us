import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Fraunces } from 'next/font/google'
import { draftMode } from 'next/headers'
import type { ReactNode } from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/Preview/LivePreviewListener'
import { PreviewBar } from '@/components/Preview/PreviewBar'
import { quickExitURL, socialLinks } from '@/components/safety'
import { ShootingStars } from '@/components/ShootingStars'
import { getSiteSettings } from '@/lib/content'
import { CANONICAL_ORIGIN } from '@/lib/seo'
import '@/styles/global.css'

// Content comes from the CMS at request time (cached by tag in src/lib/content.ts), so the build
// never needs the database.
export const dynamic = 'force-dynamic'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow',
  display: 'swap',
  fallback: ['Arial Narrow', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
}

export const viewport: Viewport = {
  themeColor: '#0a1030',
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const [settings, draft] = await Promise.all([getSiteSettings(), draftMode()])

  return (
    <html lang="en" className={`${fraunces.variable} ${barlow.variable}`}>
      <body>
        <ShootingStars />
        <a href="#main" className="skip label">
          Skip to content
        </a>
        <Header social={socialLinks(settings)} quickExitURL={quickExitURL(settings)} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer settings={settings} />
        {draft.isEnabled && (
          <>
            <LivePreviewListener />
            <PreviewBar />
          </>
        )}
      </body>
    </html>
  )
}
