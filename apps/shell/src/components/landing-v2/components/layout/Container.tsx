import type { CSSProperties, ReactNode } from 'react'

type ContainerProps = {
  children: ReactNode
  wide?: boolean
  style?: CSSProperties
  className?: string
  id?: string
}

/**
 * Container — the landing's max-width wrapper. Default cap 1240px; `wide`
 * bumps to 1360px for sections that want edge-to-edge media (hero stage,
 * pillars bento).
 *
 * Horizontal padding shrinks at ≤720px to match the design bundle.
 */
export function Container({
  children,
  wide = false,
  style,
  className,
  id,
}: ContainerProps) {
  return (
    <div
      id={id}
      className={`lp-container ${wide ? 'lp-container--wide' : ''} ${className ?? ''}`.trim()}
      style={style}
    >
      {children}
    </div>
  )
}
