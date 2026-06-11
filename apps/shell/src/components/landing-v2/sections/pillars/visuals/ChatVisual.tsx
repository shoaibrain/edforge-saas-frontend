type VisualProps = { accent: string; ink: string }

/**
 * ChatVisual — two stacked message bubbles (EN + ES) showing auto-translate.
 * Second bubble indents right for a conversational rhythm.
 */
export function ChatVisual({ accent, ink }: VisualProps) {
  const messages = [
    { who: 'Ms. Ruiz', text: 'Fall conferences start next week', tag: 'EN' },
    { who: 'Sra. Ruiz', text: 'Las conferencias de otoño...', tag: 'ES' },
  ]
  return (
    <div className="gap-1.5" style={{ display: 'flex', flexDirection: 'column' }}>
      {messages.map((m, i) => (
        <div
          key={i}
          // allow-presentation-style: decorative bubble chrome, white + soft drop shadow
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: '0 4px 12px -4px rgba(29,53,87,0.10)',
            transform: i ? 'translateX(20px)' : 'none',
          }}
        >
          <div
            className="gap-2 mb-1"
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              // allow-presentation-style: editorial 10px name + per-card palette ink
              style={{ fontSize: 10, fontWeight: 700, color: ink }}
            >
              {m.who}
            </div>
            <div
              // allow-presentation-style: editorial 8px tag + per-card accent tint/color
              style={{
                fontSize: 8,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: `${accent}22`,
                color: accent,
                letterSpacing: '0.08em',
              }}
            >
              {m.tag}
            </div>
          </div>
          <div
            // allow-presentation-style: editorial 11px text + per-card palette ink
            style={{ fontSize: 11, color: ink, opacity: 0.75 }}
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}
