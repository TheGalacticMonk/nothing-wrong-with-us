import type { Media } from '@/payload-types'

/** Anything with the upload fields Payload adds (Media, Collage, Songs). */
type Upload = Pick<Media, 'url' | 'width' | 'height'> & { alt?: string | null }

/**
 * Upload relationships are typed `number | Media`: at depth 1 they are objects, but a missing or
 * deleted file comes back as an id or null. Returns null in that case so callers render nothing.
 */
export const asUpload = <T extends Upload>(value: number | T | null | undefined): T | null =>
  value && typeof value === 'object' && typeof value.url === 'string' && value.url ? value : null

/**
 * Uploads served by Payload itself (/api/<collection>/file/…) can't go through the image optimiser
 * on Workers: OpenNext reads relative sources from static assets only. Those are shown as-is;
 * uploads on the public media host (MEDIA_PUBLIC_URL, production) are resized by Cloudflare Images.
 */
export const isUnoptimizable = (src: string) => src.startsWith('/')

/** `next/image` props for an upload. Falls back to a square when dimensions are unknown. */
export const imageSource = (upload: Upload) => ({
  src: upload.url as string,
  width: upload.width || 1200,
  height: upload.height || 1200,
  unoptimized: isUnoptimizable(upload.url as string),
})
