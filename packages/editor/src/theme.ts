/**
 * EdForge Lexical Theme
 *
 * Maps Lexical node types to EdForge Tailwind classes.
 */

import type { EditorThemeClasses } from 'lexical'

export const edforgeEditorTheme: EditorThemeClasses = {
  paragraph: 'mb-2 text-text-primary text-sm leading-relaxed',
  heading: {
    h1: 'text-2xl font-bold text-text-primary mb-3',
    h2: 'text-xl font-semibold text-text-primary mb-2',
    h3: 'text-lg font-semibold text-text-primary mb-2',
    h4: 'text-base font-medium text-text-primary mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono text-sm bg-surface-secondary px-1.5 py-0.5 rounded',
  },
  list: {
    ol: 'list-decimal ml-6 mb-2',
    ul: 'list-disc ml-6 mb-2',
    nested: { listitem: 'list-none' },
    listitem: 'mb-1',
    listitemChecked: 'line-through text-text-tertiary',
    listitemUnchecked: '',
  },
  link: 'text-teal-500 hover:text-teal-600 underline cursor-pointer',
  quote: 'border-l-4 border-border-primary pl-4 py-1 text-text-secondary italic mb-2',
  code: 'font-mono text-sm bg-surface-secondary rounded-lg p-3 mb-2 block overflow-x-auto',
}
