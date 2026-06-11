/**
 * Edforge brand mark + wordmark, mirroring the design bundle.
 * Stroke colours are locked to the gradient in the original design
 * (teal → cyan) and intentionally do NOT follow the landing palette —
 * brand stays brand.
 */

type EdforgeLogoProps = {
  size?: number
  /** Optional override for the aria-label on the SVG. */
  label?: string
}

export function EdforgeLogo({ size = 34, label = 'Edforge' }: EdforgeLogoProps) {
  return (
    <div className="gap-2.5" style={{ display: 'flex', alignItems: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        aria-label={label}
        role="img"
        fill="none"
      >
        <defs>
          <linearGradient id="edforge-mark-sh" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#005f73" />
            <stop offset="100%" stopColor="#0a9396" />
          </linearGradient>
        </defs>
        <path
          d="M 32 158 L 85 52 Q 94 34 112 34 L 168 34 M 100 96 L 168 96 M 100 158 L 168 158"
          fill="none"
          stroke="url(#edforge-mark-sh)"
          strokeWidth="17"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          className="text-lg text-[var(--lp-ink)]"
          style={{
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Edforge
        </span>
        <span
          // allow-presentation-style: editorial 9.5px sub-wordmark size, no scale class
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: 'var(--lp-ink-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          Technologies
        </span>
      </div>
    </div>
  )
}
