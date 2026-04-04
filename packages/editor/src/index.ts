/**
 * @edforge/editor — Shared rich text editor package
 */

export { EditorShell, type EditorShellProps } from './EditorShell'
export { ReadOnlyRenderer } from './ReadOnlyRenderer'
export { edforgeEditorTheme } from './theme'
export {
  serializeEditorState,
  deserializeEditorState,
  editorStateToPlainText,
  isEditorStateEmpty,
} from './utils/serialization'
