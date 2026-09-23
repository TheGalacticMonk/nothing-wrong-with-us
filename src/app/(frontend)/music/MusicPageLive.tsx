'use client'

import { useOrigin } from '@/components/Preview/useOrigin'
import { useLivePreviewCollection } from '@/components/Preview/useLivePreviewCollection'
import type { Song } from '@/payload-types'
import { MusicPageView, type MusicPageViewProps } from './MusicPageView'

export const MusicPageLive = ({
  initialSongs,
  ...rest
}: Omit<MusicPageViewProps, 'songs'> & { initialSongs: Song[] }) => {
  const origin = useOrigin()
  const songs = useLivePreviewCollection<Song>({
    collectionSlug: 'songs',
    depth: 1,
    initialItems: initialSongs,
    serverURL: origin ?? '',
  })
  return <MusicPageView songs={origin ? songs : initialSongs} {...rest} />
}
