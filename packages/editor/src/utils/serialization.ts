/**
 * Editor Serialization Utilities
 */

import type { EditorState, SerializedEditorState } from 'lexical'
import { $getRoot } from 'lexical'

export function serializeEditorState(editorState: EditorState): string {
  return JSON.stringify(editorState.toJSON())
}

export function deserializeEditorState(json: string): SerializedEditorState {
  return JSON.parse(json) as SerializedEditorState
}

export function editorStateToPlainText(editorState: EditorState): string {
  return editorState.read(() => {
    const root = $getRoot()
    return root.getTextContent()
  })
}

export function isEditorStateEmpty(editorState: EditorState): boolean {
  return editorState.read(() => {
    const root = $getRoot()
    const text = root.getTextContent().trim()
    return text.length === 0
  })
}
