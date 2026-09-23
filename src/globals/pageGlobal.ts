import type { GlobalConfig } from 'payload'

import { publishedOrSignedIn, signedIn } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'
import { pageLivePreview } from '@/lib/livePreview'
import type { PageGlobalSlug } from '@/lib/paths'

/**
 * Shared setup for every page: listed under "Pages", drafts with autosave (so Live Preview
 * updates as you type), a single Publish button, version history, and instant site refresh.
 */
export const pageGlobal = (
  slug: PageGlobalSlug,
  label: string,
  description: string,
  fields: GlobalConfig['fields'],
): GlobalConfig => ({
  slug,
  label,
  admin: {
    group: 'Pages',
    hideAPIURL: true,
    description,
    livePreview: pageLivePreview(slug),
    // A page always exists on the site; "Unpublish" would blank it. Drafts + History cover undo.
    components: { elements: { UnpublishButton: '/admin/NoUnpublish' } },
  },
  access: { read: publishedOrSignedIn, update: signedIn, readVersions: signedIn },
  versions: { drafts: { autosave: { interval: 800 } }, max: 50 },
  hooks: { afterChange: [revalidateGlobal] },
  fields,
})
