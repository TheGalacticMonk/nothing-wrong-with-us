'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'

import { useOrigin } from '@/components/Preview/useOrigin'
import type { ArtPage as ArtPageData } from '@/payload-types'
import { ArtView, type ArtViewProps } from './ArtView'

type Props = Omit<ArtViewProps, 'page'> & { initialPage: ArtPageData | null | undefined }

export const ArtLive = ({ initialPage, ...rest }: Props) => {
  const origin = useOrigin()
  // See HomeLive for why the hook must not mount until the real origin is known.
  if (!origin) return <ArtView page={initialPage} {...rest} />
  return <ArtLiveSynced origin={origin} initialPage={initialPage} {...rest} />
}

const ArtLiveSynced = ({ origin, initialPage, ...rest }: Props & { origin: string }) => {
  const { data } = useLivePreview<ArtPageData>({
    initialData: initialPage ?? ({} as ArtPageData),
    serverURL: origin,
    depth: 1,
  })
  return <ArtView page={data} {...rest} />
}
