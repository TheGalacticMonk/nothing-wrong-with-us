import type { Media } from '@/payload-types'

/** Anything with the upload fields Payload adds (Media, Collage, Songs). */
type Upload = Pick<Media, 'url' | 'width' | 'height'> & { alt?: string | null }

/**
 * Upload relationships are typed `number | Media`: at depth 1 they are objects, but a missing or
 * deleted file comes back as an id or null. Returns null in that case so callers render nothing.
 */
export const asUpload = <T extends Upload>(value: number | T | null | undefined): T | null =>
  value && typeof value === 'object' && typeof value.url === 'string' && value.url ? value : null

/** `next/image` props for an upload. Falls back to a square when dimensions are unknown. */
export const imageSource = (upload: Upload) => ({
  src: upload.url as string,
  width: upload.width || 1200,
  height: upload.height || 1200,
})
