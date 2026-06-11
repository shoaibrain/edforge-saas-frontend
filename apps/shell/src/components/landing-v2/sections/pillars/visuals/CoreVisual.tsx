type VisualProps = { accent: string; ink: string }

/**
 * CoreVisual — stacked attendance roster card, tilted for depth.
 */
export function CoreVisual({ accent, ink }: VisualProps) {
  const students = [
    { name: 'Alex Morgan', tint: '#F47E3E' },
    { name: 'Bria Chen', tint: '#0F766E' },
    { name: 'Cam Patel', tint: '#D98E04' },
    { name: 'Dani Ruiz', tint: '#3D6BE0' },
  ]
  return (
    <div
      // allow-presentation-style: decorative tilted card chrome, white + soft drop shadow
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 8px 24px -8px rgba(29,53,87,0.15)',
        transform: 'rotate(-3deg)',
      }}
    >
      <div
        className="gap-2 mb-2.5"
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          // allow-presentation-style: per-card accent swatch fill
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: accent,
          }}
        />
        <div
          // allow-presentation-style: editorial 11px label + per-card palette ink
          style={{ fontSize: 11, fontWeight: 700, color: ink }}
        >
          Attendance · 3rd Grade
        </div>
      </div>
      {students.map((s, i) => (
        <div
          key={s.name}
          className="gap-2 pt-[6px] pb-[6px]"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderTop: i ? '1px solid rgba(29,53,87,0.06)' : 'none',
          }}
        >
          <div
            // allow-presentation-style: per-student tint avatar fill
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: `${s.tint}33`,
            }}
          />
          <div
            // allow-presentation-style: editorial 11px name + per-card palette ink
            style={{ fontSize: 11, flex: 1, color: ink, opacity: 0.85 }}
          >
            {s.name}
          </div>
          <div
            // allow-presentation-style: editorial 10px status dot + per-card accent
            style={{ fontSize: 10, color: accent, fontWeight: 700 }}
          >●</div>
        </div>
      ))}
    </div>
  )
}
