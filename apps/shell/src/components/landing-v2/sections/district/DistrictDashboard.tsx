import { Icon } from '../../components/Icon'
import { Tag } from '@edforge/ui'

/**
 * DistrictDashboard — static mockup used as the fallback / `?mode=dashboard`
 * view for the District Leaders use-case. Pure presentation; no data fetch.
 * Rendered inside DemoVideo's dashboard wrapper.
 */
export function DistrictDashboard() {
  return (
    <div className="p-6 bg-[var(--lp-bg-elevated)]">
      <div
        className="mb-[18px]"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            // allow-presentation-style: editorial 13px heading
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--lp-ink)' }}
          >
            District Overview
          </div>
          <div
            // allow-presentation-style: editorial 11.5px subtitle
            style={{ fontSize: 11.5, color: 'var(--lp-ink-muted)', marginTop: 2 }}
          >
            Real-time performance metrics
          </div>
        </div>
        <div className="gap-1.5" style={{ display: 'flex' }}>
          <Tag variant="ink">4 schools</Tag>
          <Tag variant="green" dot>
            Live
          </Tag>
        </div>
      </div>

      {/* Stat cards */}
      <div
        className="gap-2.5 mb-3.5"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {STAT_CARDS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Chart + action items */}
      <div className="gap-2.5" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr' }}>
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
    value: '4,120',
    delta: '+2.5%',
    accent: 'var(--lp-primary)',
    icon: 'core',
  },
  {
    label: 'Total staff',
    value: '310',
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
      className="p-3 bg-[var(--lp-bg-warm)]"
      style={{
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
      }}
    >
      <div
        className="mb-1.5"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div
          // allow-presentation-style: per-stat data-driven icon accent color
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
        <span
          // allow-presentation-style: editorial 10.5px delta chip
          style={{ fontSize: 10.5, color: 'var(--lp-green-ink)', fontWeight: 600 }}
        >
          ▲ {delta}
        </span>
      </div>
      <div
        className="text-xl text-[var(--lp-ink)]"
        style={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        // allow-presentation-style: editorial 10.5px label
        style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)', marginTop: 1 }}
      >
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
      className="pt-[14px] pb-[14px] pl-[14px] pr-[14px]"
      style={{
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
      }}
    >
      <div
        className="mb-3"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div
          // allow-presentation-style: editorial 12.5px chart title
          style={{ fontSize: 12.5, fontWeight: 600 }}
        >Financial performance</div>
        <div
          // allow-presentation-style: editorial 11px filter chip
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
      className="pt-[14px] pb-[14px] pl-[14px] pr-[14px]"
      style={{
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
      }}
    >
      <div
        // allow-presentation-style: editorial 12.5px panel title
        style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}
      >
        Action items
      </div>
      {items.map((it, i) => (
        <div
          key={it.title}
          className="gap-2 pt-[7px] pb-[7px]"
          style={{
            display: 'flex',
            borderTop: i ? '1px solid var(--lp-border)' : 'none',
          }}
        >
          <span
            aria-hidden
            // allow-presentation-style: per-item data-driven dot color
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
            <div
              // allow-presentation-style: editorial 11.5px item title
              style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--lp-ink)' }}
            >
              {it.title}
            </div>
            <div
              // allow-presentation-style: editorial 10.5px item description
              style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}
            >
              {it.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
