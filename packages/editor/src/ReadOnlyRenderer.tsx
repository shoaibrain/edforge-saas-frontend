/**
 * ReadOnlyRenderer — Lightweight read-only rich text renderer
 */

import { EditorShell } from './EditorShell'

interface ReadOnlyRendererProps {
  content: string | null | undefined
  className?: string
}

export function ReadOnlyRenderer({ content, className }: ReadOnlyRendererProps) {
  if (!content) {
    return null
  }

  // Validate JSON
  try {
    JSON.parse(content)
  } catch {
    return (
      <p className="text-sm text-text-secondary">{content}</p>
    )
  }

  return (
    <EditorShell
      initialState={content}
      readOnly
      minHeight="auto"
      className={`border-none ${className || ''}`}
    />
  )
}
