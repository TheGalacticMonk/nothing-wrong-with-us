import { writingEditor } from '@/fields/richText'
import { seoFields } from '@/fields/seo'
import { pageGlobal } from './pageGlobal'

export const ResourcesPage = pageGlobal('resources-page', 'Resources', 'Definitions, documents and helpful links.', [
  { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Resources' },
  { name: 'body', type: 'richText', label: 'Page text', editor: writingEditor, required: true },
  seoFields({
    title: 'Resources',
    description:
      'Definitions, declassified government documents and support websites that Becca Berry has found helpful for understanding trauma-based mind control.',
  }),
])
