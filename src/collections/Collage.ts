import type { CollectionConfig } from 'payload'

import { publishedOrSignedIn, signedIn } from '@/access'
import { altField } from '@/fields/alt'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { livePreviewFor } from '@/lib/livePreview'

export const Collage: CollectionConfig = {
  slug: 'collage',
  labels: { singular: 'Collage piece', plural: 'Collage' },
  orderable: true,
  admin: {
    group: 'Art',
    description:
      'Every piece in the Collage gallery. Drag the handle on the left to change the order they appear in.',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'title', '_status'],
    livePreview: livePreviewFor('/collage-art'),
  },
  access: {
    read: publishedOrSignedIn,
    create: signedIn,
    update: signedIn,
    delete: signedIn,
  },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    altField,
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title (optional)',
          admin: { width: '70%', description: 'Not shown on the site yet. Useful for finding pieces here.' },
        },
        { name: 'year', type: 'number', label: 'Year (optional)', min: 1990, max: 2100, admin: { width: '30%' } },
      ],
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    crop: false,
    focalPoint: false,
    displayPreview: true,
    adminThumbnail: ({ doc }) => (typeof doc.url === 'string' ? doc.url : null),
  },
}
