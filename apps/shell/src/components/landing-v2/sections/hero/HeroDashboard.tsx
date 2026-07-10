import { Icon, type IconName } from '../../components/Icon'
import { Tag } from '@edforge/ui'

/**
 * HeroDashboard — the static product mock shown inside the hero laptop frame.
 * A calm, single-school "everything in one place" overview with clearly-labelled
 * sample data. Deliberately distinct from the District use-case dashboard below
 * (different KPIs + a "Today" list) so the two don't read as duplicates. Pure
 * presentation; no data fetch.
 */
export function HeroDashboard() {
  return (
    <div
      className="bg-[var(--lp-bg-elevated)]"
      // allow-presentation-style: fills the 16:10 laptop screen as a flex column
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Product header */}
      <div
        className="pt-[18px] pb-[14px] pl-6 pr-6"
        // allow-presentation-style: header row divider
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--lp-border)',
        }}
      >
        <div>
          <div
            className="lp-serif"
            // allow-presentation-style: editorial 20px wordmark
            style={{ fontSize: 20, fontWeight: 700, color: 'var(--lp-primary)' }}
          >
            Edforge
          </div>
          <div
            // allow-presentation-style: editorial 12px subtitle
            style={{ fontSize: 12, color: 'var(--lp-ink-muted)', marginTop: 2 }}
          >
            School overview · everything in one place
          </div>
        </div>
        <Tag variant="ink">Sample data</Tag>
      </div>

      {/* Body fills the remaining height */}
      <div
        className="pt-5 pb-5 pl-6 pr-6"
        // allow-presentation-style: body fills remaining screen height as a column
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}
      >
        <div
          className="gap-2.5"
          // allow-presentation-style: 4-up KPI grid
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        <div
          className="gap-2.5"
          // allow-presentation-style: chart/list split filling remaining height
          style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', flex: 1, minHeight: 0 }}
        >
          <AttendanceChart />
          <TodayList />
        </div>
      </div>
    </div>
  )
}

type Kpi = {
  label: string
  value: string
  caption: string
  icon: IconName
  accent: string
}

const KPIS: Kpi[] = [
  {
    label: 'Students',
    value: '1,240',
    caption: 'enrolled this term',
    icon: 'student',
    accent: 'var(--lp-primary)',
  },
  {
    label: 'Attendance today',
    value: '96%',
    caption: 'across all grades',
    icon: 'check',
    accent: 'var(--lp-teal-ink)',
  },
  {
    label: 'Fees collected',
    value: '82%',
    caption: 'of this term billed',
    icon: 'finance',
    accent: 'var(--lp-violet)',
  },
  {
    label: 'Exams',
    value: '3',
    caption: 'scheduled this week',
    icon: 'clipboard',
    accent: 'var(--lp-blue)',
  },
]

function KpiCard({ label, value, caption, icon, accent }: Kpi) {
  return (
    <div
      className="p-3 bg-[var(--lp-bg-warm)]"
      // allow-presentation-style: KPI card border + radius
      style={{ border: '1px solid var(--lp-border)', borderRadius: 12 }}
    >
      <div
        className="mb-2"
        // allow-presentation-style: per-KPI data-driven icon accent tile
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
      <div
        className="text-xl text-[var(--lp-ink)]"
        // allow-presentation-style: editorial KPI value weight/tracking
        style={{ fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div
        // allow-presentation-style: editorial 11px KPI label
        style={{ fontSize: 11, fontWeight: 600, color: 'var(--lp-ink)', marginTop: 2 }}
      >
        {label}
      </div>
      <div
        // allow-presentation-style: editorial 10.5px KPI caption
        style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}
      >
        {caption}
      </div>
    </div>
  )
}

function AttendanceChart() {
  const bars: Array<[string, number]> = [
    ['Sun', 92],
    ['Mon', 95],
    ['Tue', 94],
    ['Wed', 97],
    ['Thu', 96],
    ['Fri', 93],
  ]
  return (
    <div
      className="pt-[14px] pb-[14px] pl-[14px] pr-[14px]"
      // allow-presentation-style: chart card border + radius, column layout
      style={{
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="mb-3"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <div
          // allow-presentation-style: editorial 12.5px chart title
          style={{ fontSize: 12.5, fontWeight: 600 }}
        >
          Attendance this week
        </div>
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
          This week ▾
        </div>
      </div>
      <svg
        viewBox="0 0 264 108"
        // allow-presentation-style: chart grows to fill the card
        style={{ width: '100%', flex: 1, minHeight: 100 }}
        aria-label="Daily attendance this week"
        role="img"
      >
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            x2="264"
            y1={16 + i * 22}
            y2={16 + i * 22}
            stroke="var(--lp-border)"
          />
        ))}
        {bars.map(([d, v], i) => (
          <g key={d}>
            <rect
              x={14 + i * 42}
              y={100 - v}
              width="22"
              height={v}
              rx="4"
              fill="var(--lp-primary)"
              opacity={0.85}
            />
            <text
              x={25 + i * 42}
              y="106"
              textAnchor="middle"
              fontSize="7.5"
              fill="var(--lp-ink-hint)"
              fontFamily="Inter"
            >
              {d}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function TodayList() {
  const items: Array<{ accent: string; title: string; meta: string }> = [
    { accent: 'var(--lp-primary)', title: 'Grade 8 unit exam', meta: '10:00 · Hall A' },
    { accent: 'var(--lp-blue)', title: 'Fee invoices issued', meta: '24 families' },
    { accent: 'var(--lp-green)', title: 'New enrollments', meta: '2 pending review' },
  ]
  return (
    <div
      className="pt-[14px] pb-[14px] pl-[14px] pr-[14px]"
      // allow-presentation-style: list card border + radius
      style={{ border: '1px solid var(--lp-border)', borderRadius: 12 }}
    >
      <div
        // allow-presentation-style: editorial 12.5px list title
        style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}
      >
        Today
      </div>
      {items.map((it, i) => (
        <div
          key={it.title}
          className="gap-2 pt-[7px] pb-[7px]"
          // allow-presentation-style: list row divider
          style={{ display: 'flex', borderTop: i ? '1px solid var(--lp-border)' : 'none' }}
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
              // allow-presentation-style: editorial 10.5px item meta
              style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}
            >
              {it.meta}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
