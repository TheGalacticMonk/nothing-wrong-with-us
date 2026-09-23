'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'

import { useOrigin } from '@/components/Preview/useOrigin'
import type { HomePage as HomePageData } from '@/payload-types'
import { HomeView, type HomeViewProps } from './HomeView'

type Props = Omit<HomeViewProps, 'home'> & { initialHome: HomePageData | null | undefined }

/**
 * Live Preview only: re-renders the Home page instantly as the editor types, using
 * `useLivePreview`'s client-side merge instead of waiting on the autosave round trip. Rendered
 * only when `draftMode().isEnabled` (see `page.tsx`), so this client bundle never reaches a
 * normal visitor.
 */
export const HomeLive = ({ initialHome, ...rest }: Props) => {
  const origin = useOrigin()
  // `useLivePreview` sends its one-time "ready" postMessage on mount; calling it before the
  // origin is known would target an empty string and throw, permanently skipping that signal
  // (the library tracks "already sent" in a ref) so the admin would never start syncing. Wait for
  // the real origin before mounting the hook at all.
  if (!origin) return <HomeView home={initialHome} {...rest} />
  return <HomeLiveSynced origin={origin} initialHome={initialHome} {...rest} />
}

const HomeLiveSynced = ({ origin, initialHome, ...rest }: Props & { origin: string }) => {
  const { data } = useLivePreview<HomePageData>({
    initialData: initialHome ?? ({} as HomePageData),
    serverURL: origin,
    depth: 1,
  })
  return <HomeView home={data} {...rest} />
}
