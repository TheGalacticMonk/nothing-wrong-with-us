'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * Payload Live Preview: when the editor autosaves, the admin posts a message to this frame and
 * the page re-renders on the server with the latest draft. Rendered only in draft mode.
 */
export const LivePreviewListener = () => {
  const router = useRouter()
  // The admin runs on the same origin as the site (localhost, preview deploys, production).
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    (): string | null => null,
  )
  if (!origin) return null
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />
}
