import type { Field } from 'payload'

/**
 * "How this page looks in Google and when shared". Kept to the two things that matter;
 * the canonical URL, Open Graph tags and structured data are generated automatically.
 */
export const seoFields = (defaults: { title: string; description: string }): Field => ({
  name: 'seo',
  type: 'group',
  label: 'Search & sharing',
  admin: {
    description: 'How this page appears in Google results and when someone shares the link.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page title in Google',
      required: true,
      defaultValue: defaults.title,
      admin: {
        description: 'Shown as the blue link in Google and on the browser tab. “— Nothing Wrong With You” is added automatically.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short summary',
      required: true,
      defaultValue: defaults.description,
      maxLength: 200,
      admin: {
        description: 'One or two sentences. Shown under the page title in Google. About 150 characters is ideal.',
      },
    },
    {
      name: 'shareImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Sharing image (optional)',
      admin: {
        description:
          'Shown when the link is shared on social media. Leave empty to use the site-wide sharing image from Site settings.',
      },
    },
  ],
})
