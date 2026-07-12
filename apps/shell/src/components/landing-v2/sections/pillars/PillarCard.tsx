import { useState, type ReactNode } from 'react'

export type PillarCardPalette = {
  /** Card background color. */
  bg: string
  /** Title + description text color. */
  ink: string
  /** +-button color and visual accents. */
  accent: string
}

type PillarCardProps = {
  title: string
  description: string
  palette: PillarCardPalette
  visual: ReactNode
  /** Desktop grid column span (12-col grid). */
  colSpan: number
  /** Link target; defaults to '#' stub until feature pages exist. */
  href?: string
  /** Click handler — used for analytics hooking from PlatformPillars. */
  onClick?: () => void
}

/**
 * PillarCard — one bento-grid tile in the Platform Pillars section.
 *
 * Renders as an `<a>` so keyboard users can activate it. Hover elevates the
 * card and rotates the +-button to signal "drill in". Palette (bg / ink /
 * accent) is per-card; these are NOT landing-global tokens so the bento
 * can stay visually varied without polluting the surface tokens.
 */
export function PillarCard({
  title,
  description,
  palette,
  visual,
  colSpan,
  href = '#',
  onClick,
}: PillarCardProps) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={href}
      className="lp-pillar-card"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      // allow-presentation-style: per-card palette background + hover-driven elevation shadow
      style={{
        gridColumn: `span ${colSpan}`,
        position: 'relative',
        background: palette.bg,
        borderRadius: 24,
        padding: 28,
        overflow: 'hidden',
        textDecoration: 'none',
        transition:
          'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 24px 48px -16px rgba(29,53,87,0.22)'
          : '0 2px 0 rgba(29,53,87,0.04)',
        display: 'block',
      }}
    >
      <div
        // allow-presentation-style: fluid clamp() title size + per-card palette ink
        style={{
          fontSize: 'clamp(22px, 2.2vw, 30px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: palette.ink,
          maxWidth: '75%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {title}
      </div>
      <div
        // allow-presentation-style: per-card palette ink description
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: palette.ink,
          opacity: 0.75,
          maxWidth: '70%',
          marginTop: 12,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {description}
      </div>

      {/* Decorative artwork */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -10,
          bottom: -10,
          width: '55%',
          maxWidth: 340,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {visual}
      </div>

      {/* Expand affordance */}
      <div
        aria-hidden
        // allow-presentation-style: per-card palette accent button + decorative shadow
        style={{
          position: 'absolute',
          bottom: 22,
          right: 22,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: palette.accent,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          fontSize: 22,
          fontWeight: 400,
          boxShadow: '0 6px 16px -4px rgba(29,53,87,0.25)',
          transform: hover ? 'rotate(90deg) scale(1.05)' : 'rotate(0deg) scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 3,
        }}
      >
        +
      </div>
    </a>
  )
}
