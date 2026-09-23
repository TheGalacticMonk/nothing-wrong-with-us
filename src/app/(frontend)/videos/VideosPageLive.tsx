'use client'

import { useOrigin } from '@/components/Preview/useOrigin'
import { useLivePreviewCollection } from '@/components/Preview/useLivePreviewCollection'
import type { Video } from '@/payload-types'
import { VideosPageView, type VideosPageViewProps } from './VideosPageView'

export const VideosPageLive = ({
  initialVideos,
  ...rest
}: Omit<VideosPageViewProps, 'videos'> & { initialVideos: Video[] }) => {
  const origin = useOrigin()
  const videos = useLivePreviewCollection<Video>({
    collectionSlug: 'videos',
    depth: 1,
    initialItems: initialVideos,
    serverURL: origin ?? '',
  })
  return <VideosPageView videos={origin ? videos : initialVideos} {...rest} />
}
