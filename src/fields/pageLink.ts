import type { Field } from 'payload'

/** The site's pages, by name, so buttons can never point at a broken URL. */
export const sitePages = [
  { label: 'Home', value: '/' },
  { label: 'About', value: '/about-me' },
  { label: 'Art', value: '/art' },
  { label: 'Collage', value: '/collage-art' },
  { label: 'Songs', value: '/music' },
  { label: 'Videos', value: '/videos' },
  { label: 'Resources', value: '/resources' },
  { label: 'Contact', value: '/contact' },
]

/** A button: the words on it, and which page it opens. */
export const buttonField = (name: string, label: string, defaults: { text: string; page: string }): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'text', type: 'text', label: 'Button text', required: true, defaultValue: defaults.text, admin: { width: '60%' } },
        {
          name: 'page',
          type: 'select',
          label: 'Opens',
          required: true,
          defaultValue: defaults.page,
          options: sitePages,
          admin: { width: '40%' },
        },
      ],
    },
  ],
})
