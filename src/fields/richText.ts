import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * The only formatting the site's writing uses (audited from the Astro Markdown).
 * Anything else (tables, code, colours, alignment, uploads) is intentionally left out
 * so the toolbar stays small and the design can't be broken from the editor.
 */
export const writingEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature({
      enabledCollections: [],
      // "Open in new tab" is automatic for links to other websites, so hide the checkbox.
      fields: ({ defaultFields }) => defaultFields.filter((field) => !('name' in field && field.name === 'newTab')),
    }),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
