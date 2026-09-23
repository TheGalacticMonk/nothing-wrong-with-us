import { writingEditor } from '@/fields/richText'
import { seoFields } from '@/fields/seo'
import { pageGlobal } from './pageGlobal'

export const AboutPage = pageGlobal('about-page', 'About', 'Becca’s story.', [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Introduction',
        fields: [
          { name: 'eyebrow', type: 'text', label: 'Small line above the heading', defaultValue: 'About Me' },
          {
            type: 'row',
            fields: [
              { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Nobody is coming to save you.', admin: { width: '50%' } },
              {
                name: 'headingEmphasis',
                type: 'text',
                label: 'Heading, pink part',
                defaultValue: 'You can save yourself!',
                admin: { width: '50%', description: 'Shown after the heading in light pink.' },
              },
            ],
          },
          { name: 'lede', type: 'text', label: 'Line under the heading', defaultValue: 'For the ones who survived what they can’t say out loud—yet' },
          {
            name: 'affirmations',
            type: 'array',
            label: 'Short lines',
            labels: { singular: 'Line', plural: 'Lines' },
            admin: { description: 'The last line is shown bold and pink.' },
            defaultValue: [
              { line: 'You’re not alone.' },
              { line: 'You’re not too much.' },
              { line: 'You’re not crazy.' },
              { line: 'You survived.' },
            ],
            fields: [{ name: 'line', type: 'text', required: true, label: false }],
          },
          {
            type: 'row',
            fields: [
              { name: 'connectText', type: 'text', label: 'Connect line', defaultValue: 'Connect with Becca Berry', admin: { width: '40%' } },
              { name: 'connectLabel', type: 'text', label: 'Link text', defaultValue: '@beccaberry', admin: { width: '25%' } },
              { name: 'connectUrl', type: 'text', label: 'Link', defaultValue: 'https://www.instagram.com/beccaberry', admin: { width: '35%' } },
            ],
          },
        ],
      },
      {
        label: 'Story',
        fields: [
          { name: 'portrait', type: 'upload', relationTo: 'media', label: 'Portrait', required: true },
          { name: 'body', type: 'richText', label: 'Story', editor: writingEditor, required: true },
        ],
      },
      {
        label: 'Search & sharing',
        fields: [
          seoFields({
            title: 'About Me',
            description:
              'Becca Berry, Esq. is an attorney, artist and survivor. Read why she built Nothing Wrong With You, a spiritual and artistic platform for survivors who are tired of healing quietly.',
          }),
        ],
      },
    ],
  },
])
