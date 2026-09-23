'use client'

import { isLivePreviewEvent, mergeData, ready } from '@payloadcms/live-preview'
import { useEffect, useState } from 'react'

/**
 * Client-side live sync for a *list* of documents from one collection (Collage, Songs, Videos).
 *
 * `useLivePreview` from `@payloadcms/live-preview-react` only tracks a single document (it keys
 * its populate request off `initialData.id`), which doesn't fit a gallery page rendering every
 * item in a collection. This does the same thing — listen for the `payload-live-preview`
 * `postMessage` the admin sends on every field change, then ask Payload to populate that one
 * edited document (so relationship/upload fields like a video's poster resolve correctly) — but
 * keyed off the id in the *incoming* message and merged into the right slot of the local list.
 *
 * Outside the live preview iframe no matching message ever arrives, so this is a no-op and
 * `initialItems` is returned unchanged.
 */
export const useLivePreviewCollection = <T extends { id: number | string }>({
  collectionSlug,
  depth = 1,
  initialItems,
  serverURL,
}: {
  collectionSlug: string
  depth?: number
  initialItems: T[]
  serverURL: string
}): T[] => {
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    // Before the real origin is known (see `useOrigin`), `serverURL` is `''`. `ready()` posts a
    // message targeting it and throws on an empty target origin — and the admin's own "ready"
    // handshake only fires once, so a failed attempt here would permanently miss it. Wait.
    if (!serverURL) return

    let cancelled = false

    const onMessage = (event: MessageEvent) => {
      if (!isLivePreviewEvent(event, serverURL)) return
      const message = event.data as {
        collectionSlug?: string
        data?: Record<string, unknown>
        locale?: string
      }
      if (message.collectionSlug !== collectionSlug) return
      const incoming = message.data
      if (!incoming || incoming.id == null) return

      // mergeData populates relationships/uploads at `depth` by asking Payload for the doc at
      // `initialData.id` (the id of the document currently open in the editor, from the incoming
      // message itself) with the posted, unsaved field values layered on top — no DB write.
      void mergeData<T>({
        collectionSlug,
        depth,
        incomingData: incoming as Partial<T>,
        initialData: incoming as T,
        locale: message.locale,
        serverURL,
      }).then((merged) => {
        if (cancelled) return
        setItems((prev) => {
          const exists = prev.some((item) => String(item.id) === String(merged.id))
          if (!exists) return prev // A brand-new, not-yet-saved item has no position to insert at.
          return prev.map((item) => (String(item.id) === String(merged.id) ? merged : item))
        })
      })
    }

    window.addEventListener('message', onMessage)
    ready({ serverURL })

    return () => {
      cancelled = true
      window.removeEventListener('message', onMessage)
    }
  }, [collectionSlug, depth, serverURL])

  return items
}
