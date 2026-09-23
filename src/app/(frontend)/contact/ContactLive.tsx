'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'

import { useOrigin } from '@/components/Preview/useOrigin'
import type { ContactPage as ContactPageData } from '@/payload-types'
import { ContactView, type ContactViewProps } from './ContactView'

type Props = Omit<ContactViewProps, 'page'> & { initialPage: ContactPageData | null | undefined }

export const ContactLive = ({ initialPage, ...rest }: Props) => {
  const origin = useOrigin()
  // See HomeLive for why the hook must not mount until the real origin is known.
  if (!origin) return <ContactView page={initialPage} {...rest} />
  return <ContactLiveSynced origin={origin} initialPage={initialPage} {...rest} />
}

const ContactLiveSynced = ({ origin, initialPage, ...rest }: Props & { origin: string }) => {
  const { data } = useLivePreview<ContactPageData>({
    initialData: initialPage ?? ({} as ContactPageData),
    serverURL: origin,
    depth: 1,
  })
  return <ContactView page={data} {...rest} />
}
