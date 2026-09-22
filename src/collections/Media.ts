import type { CollectionConfig } from 'payload'

import { signedIn } from '@/access'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { altField } from '@/fields/alt'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images' },
  disableDuplicate: true,
  admin: {
    hideAPIURL: true,
    group: 'Library',
    description:
      'Photos and artwork used on the pages: portraits, the Home page artwork, video covers. (Collage pieces live under Art → Collage.) Replacing the file of an image here changes it on every page that uses it; to change one page only, upload a new image from that page instead.',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    useAsTitle: 'alt',
  },
  access: {
    read: () => true,
    create: signedIn,
    update: signedIn,
    delete: signedIn,
  },
  hooks: {
    // An image can appear on any page, so replacing one refreshes the whole site.
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [altField],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
    // Not available on Cloudflare Workers (no sharp). Resizing happens on delivery via Cloudflare Images.
    crop: false,
    focalPoint: false,
    displayPreview: true,
    adminThumbnail: ({ doc }) => (typeof doc.url === 'string' ? doc.url : null),
  },
}
