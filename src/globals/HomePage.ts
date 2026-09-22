import { buttonField } from '@/fields/pageLink'
import { seoFields } from '@/fields/seo'
import { pageGlobal } from './pageGlobal'

export const HomePage = pageGlobal('home-page', 'Home', 'The first page visitors see.', [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Top of page',
        description: 'The large artwork and title at the very top. The site title itself comes from Site settings.',
        fields: [
          {
            name: 'heroImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Artwork',
            required: true,
            admin: { description: 'A tall (portrait) image works best. The face should be in the upper half.' },
          },
          { name: 'eyebrow', type: 'text', label: 'Small line above the title', defaultValue: 'Becca Berry, Esq.' },
          buttonField('primaryButton', 'Main button', { text: 'Read Becca’s story', page: '/about-me' }),
          buttonField('secondaryButton', 'Second button', { text: 'See the collages', page: '/collage-art' }),
        ],
      },
      {
        label: 'Message',
        description: 'The large lines of text after the artwork.',
        fields: [
          { name: 'leadIn', type: 'text', label: 'Opening line', defaultValue: 'Nobody is coming to save you.' },
          {
            name: 'stanzas',
            type: 'array',
            label: 'Lines',
            labels: { singular: 'Line', plural: 'Lines' },
            minRows: 1,
            admin: { description: 'The last line is shown bold and pink.', initCollapsed: false },
            defaultValue: [
              { line: 'You’re not alone.' },
              { line: 'You’re not too much.' },
              { line: 'You’re not crazy.' },
              { line: 'You survived.' },
            ],
            fields: [{ name: 'line', type: 'text', required: true, label: false }],
          },
          {
            name: 'closingLine',
            type: 'text',
            label: 'Line underneath',
            defaultValue: 'For the ones who survived what they can’t say out loud—yet',
          },
        ],
      },
      {
        label: 'About Becca',
        description: 'The paper-coloured section with the portrait.',
        fields: [
          { name: 'storyPortrait', type: 'upload', relationTo: 'media', label: 'Portrait', required: true },
          {
            name: 'storyQuote',
            type: 'textarea',
            label: 'Quote',
            defaultValue: 'I’m Becca Berry, Esq., and I’m done pretending healing is pretty.',
          },
          {
            name: 'storyText',
            type: 'textarea',
            label: 'Text',
            defaultValue:
              'I’m a survivor. A truth-teller. A California-raised attorney who realized the law could sometimes protect people but couldn’t save them, so I learned about the magic that could. I write, sing, collage, and conjure because my healing demanded it.',
          },
          buttonField('storyButton', 'Button', { text: 'Read the whole story', page: '/about-me' }),
        ],
      },
      {
        label: 'Art links',
        description: 'The three boxes linking to the art. The numbers (e.g. “22 collages”) update by themselves.',
        fields: [
          { name: 'doorsHeading', type: 'text', label: 'Heading', defaultValue: 'Art, in every form' },
          {
            type: 'row',
            fields: [
              { name: 'collageDoor', type: 'text', label: 'Collage box', defaultValue: 'Look', admin: { width: '33%' } },
              { name: 'songsDoor', type: 'text', label: 'Songs box', defaultValue: 'Listen', admin: { width: '33%' } },
              { name: 'videosDoor', type: 'text', label: 'Videos box', defaultValue: 'Watch', admin: { width: '33%' } },
            ],
          },
        ],
      },
      {
        label: 'Closing',
        description: 'The centred message at the bottom of the page.',
        fields: [
          { name: 'closingHeading', type: 'text', label: 'Heading', defaultValue: 'If you found this website, it’s not an accident.' },
          {
            name: 'closingText',
            type: 'textarea',
            label: 'Text',
            defaultValue: 'If something in these words made your body say “yes,” trust that. You’re in the right place.',
          },
          {
            name: 'closingWords',
            type: 'text',
            label: 'Three words',
            defaultValue: 'Magic. Art. Truth.',
            admin: { description: 'The last word is shown in italic pink.' },
          },
          buttonField('closingButton', 'Button', { text: 'Get in touch', page: '/contact' }),
        ],
      },
      {
        label: 'Search & sharing',
        fields: [
          seoFields({
            title: 'Nothing Wrong With You',
            description:
              'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq. Nobody is coming to save you. You can save yourself.',
          }),
        ],
      },
    ],
  },
])
