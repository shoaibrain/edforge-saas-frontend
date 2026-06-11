type VisualProps = { accent: string; ink: string }

const EVENT_DAYS = new Set([3, 7, 12, 15, 18])
const TODAY = 10

/**
 * CalendarVisual — mini March 2026 grid (3 weeks) with 5 event days and
 * today highlighted.
 */
export function CalendarVisual({ accent, ink }: VisualProps) {
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
        MARCH 2026
      </div>
      <div
        // allow-presentation-style: off-scale 3px grid gap
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 3,
        }}
      >
        {Array.from({ length: 21 }).map((_, i) => {
          const isEvent = EVENT_DAYS.has(i)
          const isToday = i === TODAY
          return (
            <div
              key={i}
              // allow-presentation-style: per-day event/today state colors + editorial 9px
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                background: isEvent
                  ? accent
                  : isToday
                  ? `${ink}20`
                  : '#F7F2EE',
                fontSize: 9,
                color: isEvent ? '#fff' : ink,
                display: 'grid',
                placeItems: 'center',
                fontWeight: isEvent ? 700 : 400,
              }}
            >
              {i + 1}
            </div>
          )
        })}
      </div>
    </div>
  )
}
