'use client'

import { useOrigin } from '@/components/Preview/useOrigin'
import { useLivePreviewCollection } from '@/components/Preview/useLivePreviewCollection'
import type { Collage } from '@/payload-types'
import { CollagePageView, type CollagePageViewProps } from './CollagePageView'

/**
 * Live Preview only: keeps the gallery in sync as the editor edits or swaps the image on a single
 * Collage item, without waiting for the autosave round trip. See `useLivePreviewCollection` for
 * why this can't just be `useLivePreview` (that hook tracks a single document, not a list).
 */
export const CollagePageLive = ({
  initialCollage,
  ...rest
}: Omit<CollagePageViewProps, 'collage'> & { initialCollage: Collage[] }) => {
  const origin = useOrigin()
  const collage = useLivePreviewCollection<Collage>({
    collectionSlug: 'collage',
    depth: 1,
    initialItems: initialCollage,
    serverURL: origin ?? '',
  })
  return <CollagePageView collage={origin ? collage : initialCollage} {...rest} />
}
