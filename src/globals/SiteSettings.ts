import type { GlobalConfig } from 'payload'

import { signedIn } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

const onOff = (defaultValue: boolean, label: string) =>
  ({ name: 'enabled', type: 'checkbox', label, defaultValue }) as const

/**
 * Things that appear on every page (header, footer, social links, support messages).
 * No drafts: changes here are small and go live when saved.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Things that appear on every page. Changes go live as soon as you press Save.',
  },
  access: { read: () => true, update: signedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'siteName', type: 'text', label: 'Site name', required: true, defaultValue: 'Nothing Wrong With You' },
            {
              name: 'tagline',
              type: 'text',
              label: 'Tagline',
              required: true,
              defaultValue: 'You Can Save Yourself',
              admin: { description: 'Shown under the title on the home page and in the footer.' },
            },
            { name: 'ownerName', type: 'text', label: 'Your name', required: true, defaultValue: 'Becca Berry' },
            {
              name: 'defaultDescription',
              type: 'textarea',
              label: 'Site summary',
              required: true,
              defaultValue: 'A spiritual and artistic storytelling platform for survivors, curated by Becca Berry, Esq.',
              admin: { description: 'Used by Google to describe the site as a whole.' },
            },
            {
              name: 'shareImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Default sharing image',
              admin: {
                description: 'Shown when a page is shared on social media, unless that page has its own. Best size: 1200 × 630.',
              },
            },
          ],
        },
        {
          label: 'Social links',
          fields: [
            {
              name: 'social',
              type: 'array',
              label: 'Social links',
              labels: { singular: 'Link', plural: 'Links' },
              admin: {
                description: 'Shown in the Social menu, the footer and on the Contact page. Drag to reorder.',
              },
              defaultValue: [
                { label: 'Instagram (personal)', url: 'https://www.instagram.com/beccaberry' },
                { label: 'Instagram (art)', url: 'https://www.instagram.com/nothingwrongwithus' },
                { label: 'Facebook', url: 'https://www.facebook.com/nothingwrongwithyouorg/' },
                { label: 'Twitter', url: 'https://twitter.com/mksurvivor' },
                { label: 'Threads', url: 'https://www.threads.com/@beccaberry' },
                { label: 'YouTube', url: 'https://www.youtube.com/@nothingwrongwithus' },
              ],
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, label: 'Name', admin: { width: '40%' } },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      label: 'Link',
                      admin: { width: '60%' },
                      validate: (v: string | null | undefined) =>
                        v && /^https:\/\//.test(v) ? true : 'Links should start with https://',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'safety',
          label: 'Support messages',
          description: 'Messages for visitors who may be struggling. Untick a box to hide that message everywhere.',
          fields: [
            {
              name: 'contentNote',
              type: 'group',
              label: 'Content note',
              admin: { description: 'Shown at the top of About, Resources and Videos.' },
              fields: [
                onOff(true, 'Show the content note'),
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Text',
                  defaultValue:
                    'Some of what is shared here discusses abuse and other trauma. Take breaks, and leave whenever you need to.',
                  admin: { condition: (_, s) => Boolean(s?.enabled) },
                },
              ],
            },
            {
              name: 'crisis',
              type: 'group',
              label: 'Crisis lines',
              admin: { description: 'Shown in the footer and on the Resources and Contact pages.' },
              fields: [
                onOff(true, 'Show crisis lines'),
                {
                  name: 'lines',
                  type: 'array',
                  label: 'Lines',
                  labels: { singular: 'Line', plural: 'Lines' },
                  admin: { condition: (_, s) => Boolean(s?.enabled) },
                  defaultValue: [
                    { name: '988 Suicide & Crisis Lifeline (US)', how: 'Call or text 988', phone: '988' },
                    { name: 'RAINN National Sexual Assault Hotline (US)', how: 'Call 1-800-656-4673', phone: '+18006564673' },
                  ],
                  fields: [
                    { name: 'name', type: 'text', required: true, label: 'Organisation' },
                    {
                      type: 'row',
                      fields: [
                        { name: 'how', type: 'text', required: true, label: 'What to do', admin: { width: '50%', placeholder: 'Call or text 988' } },
                        {
                          name: 'phone',
                          type: 'text',
                          required: true,
                          label: 'Number to dial',
                          admin: { width: '50%', description: 'Digits only; used for tap-to-call on phones.' },
                          validate: (v: string | null | undefined) =>
                            v && /^\+?\d{3,15}$/.test(v) ? true : 'Digits only, e.g. 988 or +18006564673',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'legalNotice',
              type: 'group',
              label: 'Legal notice',
              admin: { description: 'Shown at the bottom of every page.' },
              fields: [
                onOff(true, 'Show the legal notice'),
                {
                  name: 'text',
                  type: 'textarea',
                  label: 'Text',
                  defaultValue:
                    'This site is for education and creative expression. Nothing here is legal advice, and visiting it does not create an attorney-client relationship.',
                  admin: { condition: (_, s) => Boolean(s?.enabled) },
                },
              ],
            },
            {
              name: 'quickExit',
              type: 'group',
              label: 'Quick exit button',
              admin: {
                description:
                  'A red button in the header that leaves this site immediately (also: press Esc three times). Off by default.',
              },
              fields: [
                onOff(false, 'Show the quick exit button'),
                {
                  name: 'url',
                  type: 'text',
                  label: 'Where it goes',
                  defaultValue: 'https://www.google.com/',
                  admin: { condition: (_, s) => Boolean(s?.enabled) },
                },
              ],
            },
          ],
        },
        {
          name: 'contactForm',
          label: 'Contact form',
          fields: [
            {
              name: 'formspreeId',
              type: 'text',
              label: 'Formspree form ID',
              admin: {
                description:
                  'The code after /f/ in your Formspree form’s address (e.g. for https://formspree.io/f/xyzabcd enter xyzabcd). Messages go to the email set up in Formspree. While this is empty, the form is shown but can’t be sent.',
              },
              validate: (v: string | null | undefined) =>
                !v || /^[a-zA-Z0-9]{6,12}$/.test(v) ? true : 'Just the short code, not the whole link.',
            },
          ],
        },
      ],
    },
  ],
}
