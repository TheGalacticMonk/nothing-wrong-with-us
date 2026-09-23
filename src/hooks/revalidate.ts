import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { collectionTag, globalTag } from '@/lib/cacheTags'

/**
 * Expire cached content immediately so the live site shows a publish on the very next request.
 * Skipped for draft saves (nothing public changed) and outside a Next.js request (seed scripts).
 */
const expire = (tag: string, logger: { warn: (msg: string) => void }) => {
  try {
    revalidateTag(tag, { expire: 0 })
  } catch (error) {
    // No Next.js request context (e.g. `payload run scripts/seed.ts`): nothing is cached to expire.
    logger.warn(`Skipped revalidating "${tag}": ${(error as Error).message}`)
  }
}

const isDraftSave = (doc: { _status?: string | null }) => doc?._status === 'draft'

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, previousDoc, global, req, context }) => {
  // Unpublishing (published -> draft) must also update the site.
  const wasPublished = previousDoc?._status === 'published'
  if (!context.skipRevalidate && (!isDraftSave(doc) || wasPublished)) {
    expire(globalTag(global.slug), req.payload.logger)
  }
  return doc
}

export const revalidateCollection: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
  req,
  context,
}) => {
  // Unpublishing (published -> draft) must also update the site.
  const wasPublished = previousDoc?._status === 'published'
  if (!context.skipRevalidate && (!isDraftSave(doc) || wasPublished)) {
    expire(collectionTag(collection.slug), req.payload.logger)
  }
  return doc
}

export const revalidateCollectionDelete: CollectionAfterDeleteHook = ({ doc, collection, req, context }) => {
  if (!context.skipRevalidate) expire(collectionTag(collection.slug), req.payload.logger)
  return doc
}
