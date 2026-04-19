import type { ReactNode } from 'react'

/**
 * Eyebrow — uppercase, tracked label sitting above section headings.
 * Mirrors the design's `.eyebrow` class.
 */
export function Eyebrow({
  children,
  color,
}: {
  children: ReactNode
  color?: string
}) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: color ?? 'var(--lp-ink-muted)',
      }}
    >
      {children}
    </span>
  )
}
