import { Icon } from '../../components/Icon'
import { Tag } from '@edforge/ui'

/**
 * StudentDashboard — static mockup for the Students use-case fallback.
 * Shows Jordan's "Recommended For You" summary with a weekly focus chart
 * and 3 recommended tasks.
 */
export function StudentDashboard() {
  return (
    <div style={{ padding: 22, background: 'var(--lp-bg-elevated)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lp-ink)' }}>
            Recommended For You
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--lp-ink-muted)' }}>
            Jordan · Grade 10
          </div>
        </div>
        <Tag variant="blue" dot>
          On track
        </Tag>
      </div>

      <FocusChart />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TASKS.map((task, i) => (
          <TaskRow key={task.title} task={task} active={i === 0} />
        ))}
      </div>
    </div>
  )
}

function FocusChart() {
  const days: Array<[string, number]> = [
    ['Mon', 55],
    ['Tue', 50],
    ['Wed', 42],
    ['Thu', 35],
    ['Fri', 35],
    ['Sat', 28],
    ['Sun', 22],
  ]
  return (
    <div
      style={{
        padding: 14,
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'var(--lp-primary-soft)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--lp-primary-ink)',
            }}
          >
            <Icon name="sparkle" size={12} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Today's focus areas</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}>Week of Apr 15</div>
      </div>
      <svg
        viewBox="0 0 300 80"
        style={{ width: '100%', height: 80 }}
        aria-label="Weekly focus progression line chart"
        role="img"
      >
        <defs>
          <linearGradient id="lp-focus-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--lp-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--lp-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,55 C30,48 50,35 90,42 S160,30 200,35 S260,18 300,22 L300,80 L0,80 Z"
          fill="url(#lp-focus-area)"
        />
        <path
          d="M0,55 C30,48 50,35 90,42 S160,30 200,35 S260,18 300,22"
          fill="none"
          stroke="var(--lp-primary)"
          strokeWidth="2"
        />
        {days.map(([d, y], i) => (
          <g key={d}>
            <circle
              cx={8 + i * 48}
              cy={y}
              r="2.5"
              fill="#fff"
              stroke="var(--lp-primary)"
              strokeWidth="1.6"
            />
            <text
              x={8 + i * 48}
              y="78"
              textAnchor="middle"
              fontSize="8"
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

type Task = {
  color: string
  title: string
  description: string
  badge: string
}

const TASKS: Task[] = [
  {
    color: 'var(--lp-primary)',
    title: 'Practice algebra word problems',
    description: "You're close to mastering this!",
    badge: '+15 XP',
  },
  {
    color: 'var(--lp-blue)',
    title: 'Read Ch. 4: Cellular biology',
    description: '18 min · assigned by Mr. Hale',
    badge: 'Start',
  },
  {
    color: 'var(--lp-green)',
    title: 'Submit: History essay draft',
    description: 'Due Friday 5:00 PM',
    badge: 'Open',
  },
]

function TaskRow({ task, active }: { task: Task; active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        border: '1px solid var(--lp-border)',
        borderRadius: 10,
        background: active ? 'var(--lp-primary-soft)' : 'var(--lp-bg-warm)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: task.color,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--lp-ink)' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--lp-ink-muted)' }}>
          {task.description}
        </div>
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--lp-ink-muted)',
          padding: '3px 8px',
          background: 'var(--lp-bg-elevated)',
          border: '1px solid var(--lp-border)',
          borderRadius: 6,
          alignSelf: 'center',
        }}
      >
        {task.badge}
      </div>
    </div>
  )
}
