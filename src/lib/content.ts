import 'server-only'

import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'

import type { Config } from '@/payload-types'
import { collectionTag, globalTag } from './cacheTags'

/**
 * The frontend's only way to read CMS content.
 *
 * - Published content is cached and tagged; the CMS expires the tags on publish
 *   (src/hooks/revalidate.ts), so the site updates on the next request without a rebuild.
 * - In draft mode (Preview / Live Preview) everything is read uncached, including drafts.
 * - Every read also carries the media tag, because pages embed image documents.
 */

type GlobalSlug = keyof Config['globals']
type ArtCollection = 'collage' | 'songs' | 'videos'

const mediaTag = collectionTag('media')

const readGlobal = async <S extends GlobalSlug>(slug: S, draft: boolean) => {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug, depth: 1, draft, overrideAccess: draft })
}

const readCollection = async <S extends ArtCollection>(slug: S, draft: boolean) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: slug,
    depth: 1,
    draft,
    // Only published items on the public site; drafts too while previewing.
    where: draft ? undefined : { _status: { equals: 'published' } },
    overrideAccess: draft,
    sort: '_order',
    limit: 500,
    pagination: false,
  })
  return docs as Config['collections'][S][]
}

const isDraft = async () => (await draftMode()).isEnabled

export const getGlobal = async <S extends GlobalSlug>(slug: S): Promise<Config['globals'][S]> => {
  if (await isDraft()) return readGlobal(slug, true) as Promise<Config['globals'][S]>
  return unstable_cache(() => readGlobal(slug, false), ['global', slug], {
    tags: [globalTag(slug), mediaTag],
  })() as Promise<Config['globals'][S]>
}

export const getCollection = async <S extends ArtCollection>(
  slug: S,
): Promise<Config['collections'][S][]> => {
  if (await isDraft()) return readCollection(slug, true)
  return unstable_cache(() => readCollection(slug, false), ['collection', slug], {
    tags: [collectionTag(slug), mediaTag],
  })()
}

export const getSiteSettings = () => getGlobal('site-settings')
