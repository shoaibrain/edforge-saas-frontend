type VisualProps = { accent: string; ink: string }

/**
 * AnalyticsVisual — enrollment trend line chart + "+12.4%" headline.
 */
export function AnalyticsVisual({ accent, ink }: VisualProps) {
  const gradientId = `lp-pillar-analytics-${accent.replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <div
      // allow-presentation-style: decorative card chrome, white + soft drop shadow
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 8px 24px -8px rgba(29,53,87,0.15)',
      }}
    >
      <div
        // allow-presentation-style: editorial 10px label + per-card palette ink
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: ink,
          marginBottom: 10,
          letterSpacing: '0.06em',
        }}
      >
        ENROLLMENT TREND
      </div>
      <svg viewBox="0 0 200 80" width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 70 L30 55 L60 62 L90 38 L120 45 L150 22 L190 18"
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M0 70 L30 55 L60 62 L90 38 L120 45 L150 22 L190 18 L190 80 L0 80 Z"
          fill={`url(#${gradientId})`}
        />
        {[0, 30, 60, 90, 120, 150, 190].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={[70, 55, 62, 38, 45, 22, 18][i]}
            r="2.5"
            fill={accent}
          />
        ))}
      </svg>
      <div
        // allow-presentation-style: per-card palette ink headline
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: ink,
          marginTop: 6,
        }}
      >
        +12.4%
      </div>
    </div>
  )
}
