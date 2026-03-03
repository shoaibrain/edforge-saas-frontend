/**
 * EditorShell — Main composable rich text editor component
 */

import { useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import type { EditorState } from 'lexical'

import { edforgeEditorTheme } from './theme'
import { ToolbarPlugin } from './plugins/ToolbarPlugin'
import { serializeEditorState } from './utils/serialization'

export interface EditorShellProps {
  initialState?: string
  onChange?: (state: string) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: string
  maxHeight?: string
  autoFocus?: boolean
  className?: string
  ariaLabel?: string
}

export function EditorShell({
  initialState,
  onChange,
  readOnly = false,
  placeholder = 'Start typing...',
  minHeight = '120px',
  maxHeight,
  autoFocus = false,
  className = '',
  ariaLabel = 'Rich text editor',
}: EditorShellProps) {
  const initialConfig = {
    namespace: 'EdForgeEditor',
    theme: edforgeEditorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    editable: !readOnly,
    editorState: initialState || undefined,
    onError: (error: Error) => {
      console.error('[EditorShell] Error:', error)
    },
  }

  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (onChange) {
        onChange(serializeEditorState(editorState))
      }
    },
    [onChange]
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`rounded-lg border border-border-primary bg-surface-primary overflow-hidden ${className}`}>
        {!readOnly && <ToolbarPlugin />}
        <div
          className="relative"
          style={{ minHeight, maxHeight, overflowY: maxHeight ? 'auto' : undefined }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none px-4 py-3 text-sm text-text-primary"
                aria-label={ariaLabel}
                aria-multiline="true"
                style={{ minHeight }}
              />
            }
            placeholder={
              <div className="absolute top-3 left-4 text-text-tertiary text-sm pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        {onChange && <OnChangePlugin onChange={handleChange} ignoreSelectionChange />}
      </div>
    </LexicalComposer>
  )
}
