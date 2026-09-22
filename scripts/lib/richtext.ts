/**
 * Markdown <-> Lexical helpers, using the same editor features as the CMS fields
 * (`writingEditor` in src/fields/richText.ts), so the seeded JSON only contains nodes the
 * admin editor can open.
 */
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import type { SanitizedConfig } from 'payload'

import { writingEditor } from '../../src/fields/richText'
import { expandAutolinks, smartQuotes } from './legacy'

type Node = { type: string; text?: string; children?: Node[]; fields?: { url?: string }; [k: string]: unknown }
export type LexicalState = { root: Node }

let editorConfigPromise: ReturnType<typeof editorConfigFactory.fromEditor> | undefined
export const getEditorConfig = (config: SanitizedConfig) =>
  (editorConfigPromise ??= editorConfigFactory.fromEditor({ config, editor: writingEditor }))

const walk = (node: Node, fn: (n: Node) => void) => {
  fn(node)
  node.children?.forEach((child) => walk(child, fn))
}

/** Markdown (as authored for Astro) -> Lexical JSON, matching what the live site renders. */
export const markdownToLexical = async (config: SanitizedConfig, markdown: string): Promise<LexicalState> => {
  const editorConfig = await getEditorConfig(config)
  const state = convertMarkdownToLexical({ editorConfig, markdown: expandAutolinks(markdown.trim()) }) as unknown as LexicalState
  walk(state.root, (n) => {
    if (n.type === 'text' && typeof n.text === 'string') n.text = smartQuotes(n.text)
  })
  // "Open in new tab" is not stored: the frontend opens every external link in a new tab.
  return state
}

export const lexicalToMarkdown = async (config: SanitizedConfig, data: LexicalState) =>
  convertLexicalToMarkdown({ data: data as never, editorConfig: await getEditorConfig(config) })

/** Every text run, in document order, joined per block with blank lines. */
export const lexicalToText = (data: LexicalState): string => {
  const blocks: string[] = []
  const inline = (n: Node): string =>
    n.type === 'text' ? (n.text ?? '') : n.type === 'linebreak' ? '\n' : (n.children ?? []).map(inline).join('')
  const block = (n: Node) => {
    if (n.type === 'list') return n.children?.forEach(block)
    if (n.type === 'horizontalrule') return
    if (n.type === 'listitem' && n.children?.some((c) => c.type === 'list')) {
      blocks.push(n.children.filter((c) => c.type !== 'list').map(inline).join(''))
      return n.children.filter((c) => c.type === 'list').forEach(block)
    }
    blocks.push(inline(n))
  }
  data.root.children?.forEach(block)
  return blocks.filter((b) => b.trim() !== '').join('\n\n')
}

export const lexicalLinks = (data: LexicalState): string[] => {
  const urls: string[] = []
  walk(data.root, (n) => {
    if ((n.type === 'link' || n.type === 'autolink') && n.fields?.url) urls.push(n.fields.url)
  })
  return urls
}

/** Counts node types (and text formats) so structure can be compared, e.g. headings/lists/hr. */
export const lexicalStructure = (data: LexicalState) => {
  const counts: Record<string, number> = {}
  const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1)
  walk(data.root, (n) => {
    if (n.type === 'root') return
    if (n.type === 'heading') bump(`heading:${n.tag}`)
    else if (n.type === 'list') bump(`list:${n.listType}`)
    else bump(n.type)
    if (n.type === 'text' && typeof n.format === 'number' && n.format) {
      if (n.format & 1) bump('format:bold')
      if (n.format & 2) bump('format:italic')
    }
  })
  return counts
}
