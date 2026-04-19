import { Icon } from '../../components/Icon'
import { Tag } from '@edforge/ui'

/**
 * DistrictDashboard — static mockup used as the fallback / `?mode=dashboard`
 * view for the District Leaders use-case. Pure presentation; no data fetch.
 * Rendered inside DemoVideo's dashboard wrapper.
 */
export function DistrictDashboard() {
  return (
    <div style={{ padding: 24, background: 'var(--lp-bg-elevated)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lp-ink)' }}>
            District Overview
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--lp-ink-muted)', marginTop: 2 }}>
            Real-time performance metrics
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Tag variant="ink">12 schools</Tag>
          <Tag variant="green" dot>
            Live
          </Tag>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {STAT_CARDS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Chart + action items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
        <FinancialChart />
        <ActionItems />
      </div>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string
  delta: string
  accent: string
  icon: 'core' | 'users' | 'check'
}

const STAT_CARDS: StatCardProps[] = [
  {
    label: 'Total students',
    value: '45,231',
    delta: '+2.5%',
    accent: 'var(--lp-primary)',
    icon: 'core',
  },
  {
    label: 'Total staff',
    value: '3,402',
    delta: '+1.2%',
    accent: 'var(--lp-teal)',
    icon: 'users',
  },
  {
    label: 'Avg attendance',
    value: '94.2%',
    delta: '+0.8%',
    accent: 'var(--lp-violet)',
    icon: 'check',
  },
]

function StatCard({ label, value, delta, accent, icon }: StatCardProps) {
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
        background: 'var(--lp-bg-warm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'rgba(29, 53, 87, 0.06)',
            display: 'grid',
            placeItems: 'center',
            color: accent,
          }}
        >
          <Icon name={icon} size={14} />
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--lp-green-ink)', fontWeight: 600 }}>
          ▲ {delta}
        </span>
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--lp-ink)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)', marginTop: 1 }}>
        {label}
      </div>
    </div>
  )
}

function FinancialChart() {
  const bars: Array<[string, number]> = [
    ['Aug', 30],
    ['Sep', 38],
    ['Oct', 52],
    ['Nov', 44],
    ['Dec', 65],
    ['Jan', 72],
    ['Feb', 58],
    ['Mar', 68],
  ]
  return (
    <div
      style={{
        padding: 14,
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>Financial performance</div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--lp-ink-muted)',
            padding: '2px 8px',
            border: '1px solid var(--lp-border)',
            borderRadius: 6,
          }}
        >
          This Year ▾
        </div>
      </div>
      <svg
        viewBox="0 0 260 90"
        style={{ width: '100%', height: 90 }}
        aria-label="Monthly financial performance bar chart"
        role="img"
      >
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            x2="260"
            y1={20 + i * 20}
            y2={20 + i * 20}
            stroke="var(--lp-border)"
          />
        ))}
        {bars.map(([m, v], i) => (
          <g key={m}>
            <rect
              x={10 + i * 30}
              y={90 - v}
              width="16"
              height={v}
              rx="3"
              fill="var(--lp-primary)"
              opacity={0.85}
            />
            <text
              x={18 + i * 30}
              y="88"
              textAnchor="middle"
              fontSize="7"
              fill="var(--lp-ink-hint)"
              fontFamily="Inter"
            >
              {m}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function ActionItems() {
  const items: Array<{ accent: string; title: string; description: string }> = [
    {
      accent: 'var(--lp-primary)',
      title: 'Budget variance',
      description: 'Sunnyside -$12k',
    },
    {
      accent: 'var(--lp-blue)',
      title: 'New enrollments',
      description: '34 pending',
    },
    {
      accent: 'var(--lp-green)',
      title: 'Attendance up',
      description: '+1.1% WoW',
    },
  ]
  return (
    <div
      style={{
        padding: 14,
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
        Action items
      </div>
      {items.map((it, i) => (
        <div
          key={it.title}
          style={{
            display: 'flex',
            gap: 8,
            padding: '7px 0',
            borderTop: i ? '1px solid var(--lp-border)' : 'none',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: it.accent,
              marginTop: 6,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--lp-ink)' }}>
              {it.title}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}>
              {it.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
