import { seoFields } from '@/fields/seo'
import { pageGlobal } from './pageGlobal'

/**
 * The Art landing page plus the headings of the Collage, Songs and Videos pages.
 * The pieces themselves are edited under Art → Collage / Songs / Videos.
 */
export const ArtPage = pageGlobal(
  'art-page',
  'Art',
  'Headings and intros for the Art pages. To add or change collage pieces, songs or videos, use the Art section in the menu.',
  [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Art page',
          name: 'art',
          fields: [
            { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'I create art because silence was killing me.' },
            seoFields({
              title: 'Art',
              description:
                'Collage, writing, songs and mixed-media video art by Becca Berry, made as part of her healing and for other survivors.',
            }),
          ],
        },
        {
          label: 'Collage page',
          name: 'collage',
          fields: [
            { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Collage' },
            seoFields({
              title: 'Collage',
              description:
                'Collage art by Becca Berry: cut-up magazines, headlines and faces rearranged into visual testimony, made as part of her healing.',
            }),
          ],
        },
        {
          label: 'Songs page',
          name: 'songs',
          fields: [
            { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Songs' },
            {
              name: 'intro',
              type: 'textarea',
              label: 'Introduction',
              defaultValue:
                'I’ll be adding demos that I’ve been working on, just expressing and getting these songs out of me while also finding my sound.',
            },
            seoFields({
              title: 'Songs',
              description:
                'Songs and demos by Becca Berry, including 30/We Survived, The End, and Lullaby with Galactic Monk. Listen here.',
            }),
          ],
        },
        {
          label: 'Videos page',
          name: 'videos',
          fields: [
            { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Videos' },
            { name: 'lede', type: 'text', label: 'Line under the heading', defaultValue: 'Mixed Media Video Art' },
            seoFields({
              title: 'Videos',
              description: 'Mixed media video art by Becca Berry: shadowwork, mkultrasurvivor and judgement.',
            }),
          ],
        },
      ],
    },
  ],
)
