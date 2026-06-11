type VisualProps = { accent: string; ink: string }

/**
 * FinanceVisual — budget card with $4.2M headline + 62% allocation bar.
 */
export function FinanceVisual({ accent, ink }: VisualProps) {
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
        style={{ fontSize: 10, fontWeight: 700, color: ink, marginBottom: 10 }}
      >
        BUDGET · FY'26
      </div>
      <div
        // allow-presentation-style: editorial 22px headline + per-card palette ink
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: ink,
          letterSpacing: '-0.02em',
        }}
      >
        $4.2M
      </div>
      <div
        // allow-presentation-style: editorial 10px caption + per-card palette ink
        style={{ fontSize: 10, color: ink, opacity: 0.6, marginBottom: 10 }}
      >
        of $6.8M allocated
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={62}
        aria-label="Budget allocation"
        // allow-presentation-style: per-card accent-tinted track
        style={{
          height: 8,
          borderRadius: 4,
          background: `${accent}22`,
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          // allow-presentation-style: per-card accent fill
          style={{
            height: '100%',
            width: '62%',
            background: accent,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  )
}
