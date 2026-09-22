import type { CollectionConfig } from 'payload'

import { publishedOrSignedIn, signedIn } from '@/access'
import { revalidateCollection, revalidateCollectionDelete } from '@/hooks/revalidate'
import { livePreviewFor } from '@/lib/livePreview'
import { parseYouTubeId } from '@/lib/youtube'

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  orderable: true,
  disableDuplicate: true,
  admin: {
    hideAPIURL: true,
    group: 'Art',
    description:
      'Videos on the Videos page, in the order they appear; the first one is shown large. Paste a YouTube link, add a title and a line about it, and publish. Drag a video up or down in this list to change the order.',
    useAsTitle: 'title',
    defaultColumns: ['title', 'description', '_status'],
    livePreview: livePreviewFor('/videos'),
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
    {
      name: 'youtubeUrl',
      type: 'text',
      label: 'YouTube link',
      required: true,
      admin: {
        placeholder: 'https://www.youtube.com/watch?v=…',
        description: 'Copy the link from the Share button on YouTube.',
      },
      validate: (value: string | null | undefined) =>
        value && parseYouTubeId(value) ? true : 'That doesn’t look like a YouTube video link.',
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', label: 'A line about this video', required: true },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image (optional)',
      admin: {
        description: 'Shown before the video plays. Leave empty to use YouTube’s own thumbnail.',
      },
    },
  ],
}
