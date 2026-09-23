/**
 * next/image loader for production on the nothingwrongwithyou.org zone.
 *
 * Uploads live on the media domain (R2 custom domain). Cloudflare Image Transformations resize
 * them at the edge via /cdn-cgi/image/…, and the results are cached by Cloudflare, so image
 * requests never reach the Worker. Enabled only when NEXT_PUBLIC_IMAGE_TRANSFORMS=1 (see
 * next.config.ts); needs "Transformations" enabled on the zone. Other sources (e.g. YouTube
 * thumbnails) are returned unchanged.
 */
const media = (process.env.NEXT_PUBLIC_MEDIA_URL || '').replace(/\/$/, '')

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  if (!media || !src.startsWith(`${media}/`)) return src
  const path = src.slice(media.length + 1)
  return `${media}/cdn-cgi/image/width=${width},quality=${quality || 75},format=auto,fit=scale-down/${path}`
}
