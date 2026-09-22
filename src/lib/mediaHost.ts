/**
 * Public origin of the R2 media bucket (e.g. https://media.nothingwrongwithyou.org), no trailing slash.
 *
 * On Workers, next/image can only optimise same-origin *static* files or remote URLs, and serving
 * every image and song through the Worker costs CPU. So in production uploads are linked straight
 * from R2's public hostname. Unset locally: files are served by Payload at /api/<collection>/file/.
 */
export const mediaPublicURL = (process.env.MEDIA_PUBLIC_URL || '').replace(/\/$/, '')
