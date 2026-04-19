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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: '0 4px 12px -4px rgba(29,53,87,0.10)',
            transform: i ? 'translateX(20px)' : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: ink }}>
              {m.who}
            </div>
            <div
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
          <div style={{ fontSize: 11, color: ink, opacity: 0.75 }}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}
