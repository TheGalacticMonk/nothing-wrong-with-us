import type { TextField } from 'payload'

export const altField: TextField = {
  name: 'alt',
  type: 'text',
  label: 'Image description',
  required: true,
  admin: {
    description:
      'One sentence saying what is in the picture, e.g. “Becca smiling in a black rose-print top.” It is read aloud to people who can’t see the image, and shown if it doesn’t load.',
  },
}
