'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * The browser's own origin, available only after mount (avoids an SSR/client mismatch — the
 * server has no `window`). The admin always runs on the same origin as the site (localhost,
 * preview deploys, production alike), so this is what Live Preview's `serverURL` should be:
 * matching it exactly is what makes the `postMessage` origin check in `@payloadcms/live-preview`
 * work everywhere without hardcoding a domain.
 */
export const useOrigin = (): string | null =>
  useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    (): string | null => null,
  )
