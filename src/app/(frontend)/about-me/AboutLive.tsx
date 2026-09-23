'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'

import { useOrigin } from '@/components/Preview/useOrigin'
import type { AboutPage as AboutPageData } from '@/payload-types'
import { AboutView, type AboutViewProps } from './AboutView'

type Props = Omit<AboutViewProps, 'page'> & { initialPage: AboutPageData | null | undefined }

export const AboutLive = ({ initialPage, ...rest }: Props) => {
  const origin = useOrigin()
  // See HomeLive for why the hook must not mount until the real origin is known.
  if (!origin) return <AboutView page={initialPage} {...rest} />
  return <AboutLiveSynced origin={origin} initialPage={initialPage} {...rest} />
}

const AboutLiveSynced = ({ origin, initialPage, ...rest }: Props & { origin: string }) => {
  const { data } = useLivePreview<AboutPageData>({
    initialData: initialPage ?? ({} as AboutPageData),
    serverURL: origin,
    depth: 1,
  })
  return <AboutView page={data} {...rest} />
}
