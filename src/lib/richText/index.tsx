import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConvertersFunction,
  RichText as LexicalRichText,
} from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { CANONICAL_ORIGIN } from '@/lib/seo'

const OWN_HOST = new URL(CANONICAL_ORIGIN).hostname.replace(/^www\./, '')

/**
 * Links to other websites open in a new tab, exactly like the Astro Markdown plugin
 * (`externalLinksInNewTab` in legacy/astro/astro.config.mjs). Links to this site stay in the tab.
 */
export const isExternal = (href: string) => {
  if (!/^https?:\/\//i.test(href)) return false
  try {
    return new URL(href).hostname.replace(/^www\./, '') !== OWN_HOST
  } catch {
    return false
  }
}

const anchor = (href: string, children: ReactNode) =>
  isExternal(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  )

/**
 * Plain semantic HTML for the `.prose` styles in global.css: no editor class names, no
 * `<p><br></p>` for empty paragraphs, and no `value` attributes on bullet items.
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return children.length ? <p>{children}</p> : null
  },
  list: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return node.tag === 'ol' ? <ol>{children}</ol> : <ul>{children}</ul>
  },
  listitem: ({ node, nodesToJSX, parent }) => {
    const children = nodesToJSX({ nodes: node.children })
    const ordered = 'tag' in parent && parent.tag === 'ol'
    return ordered ? <li value={node.value}>{children}</li> : <li>{children}</li>
  },
  link: ({ node, nodesToJSX }) =>
    anchor(String(node.fields?.url ?? ''), nodesToJSX({ nodes: node.children })),
  autolink: ({ node, nodesToJSX }) =>
    anchor(String(node.fields?.url ?? ''), nodesToJSX({ nodes: node.children })),
})

type Props = {
  data: unknown
}

/** Renders Lexical rich text as bare elements; wrap it in `.prose` at the call site. */
export const RichText = ({ data }: Props) => {
  if (!data || typeof data !== 'object' || !('root' in data)) return null
  return (
    <LexicalRichText
      data={data as SerializedEditorState}
      converters={converters}
      disableContainer
    />
  )
}
