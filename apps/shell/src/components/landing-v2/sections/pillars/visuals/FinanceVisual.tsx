type VisualProps = { accent: string; ink: string }

/**
 * FinanceVisual — budget card with $4.2M headline + 62% allocation bar.
 */
export function FinanceVisual({ accent, ink }: VisualProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 8px 24px -8px rgba(29,53,87,0.15)',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: ink, marginBottom: 10 }}>
        BUDGET · FY'26
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: ink,
          letterSpacing: '-0.02em',
        }}
      >
        $4.2M
      </div>
      <div style={{ fontSize: 10, color: ink, opacity: 0.6, marginBottom: 10 }}>
        of $6.8M allocated
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={62}
        aria-label="Budget allocation"
        style={{
          height: 8,
          borderRadius: 4,
          background: `${accent}22`,
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
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
