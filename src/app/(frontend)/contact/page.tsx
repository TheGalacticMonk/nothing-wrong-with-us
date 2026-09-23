import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getGlobal, getSiteSettings } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import { ContactLive } from './ContactLive'
import { ContactView } from './ContactView'

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getGlobal('contact-page'), getSiteSettings()])
  return pageMetadata({ path: '/contact', seo: page?.seo, settings })
}

export default async function ContactPage() {
  const [page, settings, draft] = await Promise.all([
    getGlobal('contact-page'),
    getSiteSettings(),
    draftMode(),
  ])

  if (!settings?.contactForm?.formspreeId?.trim()) {
    console.warn(
      '[contact] No Formspree form ID in Site Settings. /contact shows the form, but sending is disabled until it is set.',
    )
  }

  if (draft.isEnabled) {
    return <ContactLive initialPage={page} settings={settings} />
  }

  return <ContactView page={page} settings={settings} />
}
