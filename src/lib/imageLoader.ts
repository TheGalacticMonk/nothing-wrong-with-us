/**
 * next/image loader for production on the nothingwrongwithyou.org zone.
 *
 * Uploads live on the media domain (R2 custom domain). Cloudflare Image Transformations resize
 * them at the edge via /cdn-cgi/image/…, cached by Cloudflare; image requests never reach the
 * Worker. Enabled only when NEXT_PUBLIC_IMAGE_TRANSFORMS=1 (see next.config.ts); needs
 * "Transformations" enabled on the zone. Other sources (e.g. YouTube thumbnails) pass through.
 *
 * NEXT_PUBLIC_IMAGE_SAME_ORIGIN=1 (when the site itself is served from the zone) requests the
 * transformation from the page's own host, `/cdn-cgi/image/<options>/<media URL>`, so images reuse
 * the page's connection instead of opening a second one to the media host.
 */
const media = (process.env.NEXT_PUBLIC_MEDIA_URL || '').replace(/\/$/, '')
const sameOrigin = process.env.NEXT_PUBLIC_IMAGE_SAME_ORIGIN === '1'

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
  const options = `width=${width},quality=${quality || 75},format=auto,fit=scale-down`
  if (sameOrigin) return `/cdn-cgi/image/${options}/${src}`
  return `${media}/cdn-cgi/image/${options}/${src.slice(media.length + 1)}`
}
