import type { CollectionConfig } from 'payload'

import { publishedOrSignedIn, signedIn } from '@/access'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { livePreviewFor } from '@/lib/livePreview'

export const Songs: CollectionConfig = {
  slug: 'songs',
  labels: { singular: 'Song', plural: 'Songs' },
  orderable: true,
  disableDuplicate: true,
  admin: {
    // Show every item on one page so any item can be dragged to any position.
    pagination: { defaultLimit: 100, limits: [100] },
    hideAPIURL: true,
    group: 'Art',
    description: 'Songs on the Songs page, in the order they appear. Upload an MP3, give it a title, and publish. Drag a song up or down in this list to change the order.',
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'duration', '_status'],
    livePreview: livePreviewFor('/music'),
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
    { name: 'title', type: 'text', required: true, label: 'Song title' },
    {
      type: 'row',
      fields: [
        {
          name: 'artist',
          type: 'text',
          required: true,
          defaultValue: 'BeccaBerry',
          admin: { width: '60%', description: 'Include anyone you collaborated with.' },
        },
        {
          name: 'duration',
          type: 'text',
          label: 'Length (optional)',
          admin: { width: '40%', placeholder: '4:11', description: 'Minutes:seconds, e.g. 4:11' },
          validate: (value: string | null | undefined) =>
            !value || /^\d{1,2}:\d{2}$/.test(value) ? true : 'Please write it as minutes:seconds, like 4:11',
        },
      ],
    },
  ],
  upload: {
    mimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav'],
  },
}
