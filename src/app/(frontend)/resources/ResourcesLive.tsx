'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'

import { useOrigin } from '@/components/Preview/useOrigin'
import type { ResourcesPage as ResourcesPageData } from '@/payload-types'
import { ResourcesView, type ResourcesViewProps } from './ResourcesView'

type Props = Omit<ResourcesViewProps, 'page'> & { initialPage: ResourcesPageData | null | undefined }

export const ResourcesLive = ({ initialPage, ...rest }: Props) => {
  const origin = useOrigin()
  // See HomeLive for why the hook must not mount until the real origin is known.
  if (!origin) return <ResourcesView page={initialPage} {...rest} />
  return <ResourcesLiveSynced origin={origin} initialPage={initialPage} {...rest} />
}

const ResourcesLiveSynced = ({ origin, initialPage, ...rest }: Props & { origin: string }) => {
  const { data } = useLivePreview<ResourcesPageData>({
    initialData: initialPage ?? ({} as ResourcesPageData),
    serverURL: origin,
    depth: 1,
  })
  return <ResourcesView page={data} {...rest} />
}
