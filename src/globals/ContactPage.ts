import { writingEditor } from '@/fields/richText'
import { seoFields } from '@/fields/seo'
import { pageGlobal } from './pageGlobal'

export const ContactPage = pageGlobal('contact-page', 'Contact', 'Contact details and the message form.', [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Page text',
        fields: [
          { name: 'eyebrow', type: 'text', label: 'Small line above the heading', defaultValue: 'Info + Contact' },
          { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'I’d love to hear from you' },
          { name: 'lede', type: 'text', label: 'Line under the heading', defaultValue: 'About me, social media, and how to get in touch' },
          { name: 'about', type: 'richText', label: 'About', editor: writingEditor, required: true },
          {
            name: 'bookingAddress',
            type: 'textarea',
            label: 'Booking + press address',
            defaultValue: 'Becca Berry\nLos Angeles, CA',
            admin: { description: 'Each line is shown on its own line.' },
          },
          { name: 'bookingHint', type: 'text', label: 'Note under the address', defaultValue: 'Choose “Booking” or “Press” in the form.' },
        ],
      },
      {
        label: 'Message form',
        description: 'Messages are delivered by Formspree. The form connection itself is set in Site Settings.',
        fields: [
          {
            name: 'topics',
            type: 'array',
            label: '“What is this about?” choices',
            labels: { singular: 'Choice', plural: 'Choices' },
            minRows: 1,
            defaultValue: [
              { topic: 'Booking' },
              { topic: 'Press' },
              { topic: 'Collaboration' },
              { topic: 'Support' },
              { topic: 'Something else' },
            ],
            fields: [{ name: 'topic', type: 'text', required: true, label: false }],
          },
        ],
      },
      {
        label: 'Search & sharing',
        fields: [
          seoFields({
            title: 'Info + Contact',
            description:
              'About Nothing Wrong With You, Becca Berry’s social media, and how to reach her for booking, press and collaboration. Based in Los Angeles, CA.',
          }),
        ],
      },
    ],
  },
])
