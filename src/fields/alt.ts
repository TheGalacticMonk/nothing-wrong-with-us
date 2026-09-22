import type { TextField } from 'payload'

export const altField: TextField = {
  name: 'alt',
  type: 'text',
  label: 'Describe this image',
  required: true,
  admin: {
    description:
      'Read aloud to people using screen readers, and shown if the image can’t load. Describe what is in the picture in one sentence, e.g. “Becca smiling in a black rose-print top.”',
  },
}
