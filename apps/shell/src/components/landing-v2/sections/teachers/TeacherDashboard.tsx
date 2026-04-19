import { Icon } from '../../components/Icon'
import { Tag } from '@edforge/ui'

/**
 * TeacherDashboard — static mockup for the Teachers & Parents use-case
 * fallback. Shows Ms. Chen's parent-engagement dashboard.
 */
export function TeacherDashboard() {
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
            Parent Engagement Dashboard
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--lp-ink-muted)' }}>
            Ms. Chen · Room 214
          </div>
        </div>
        <Tag variant="green" dot>
          Live
        </Tag>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <EngagementStat
          icon="users"
          iconAccent="var(--lp-teal-ink)"
          iconBg="var(--lp-teal-soft)"
          label="Parent Participation"
          value="92%"
          valueAccent="var(--lp-teal-ink)"
          caption="24 of 26 parents actively engaged"
        />
        <EngagementStat
          icon="chat"
          iconAccent="var(--lp-primary-ink)"
          iconBg="var(--lp-primary-soft)"
          label="Response Rate"
          value="4.2"
          valueSuffix="hrs"
          caption="Median time to reply"
        />
      </div>

      <div
        style={{
          padding: 12,
          border: '1px solid var(--lp-border)',
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
          Recent parent contact
        </div>
        {CONTACTS.map((contact, i) => (
          <ContactRow key={contact.name} {...contact} divide={i > 0} />
        ))}
      </div>
    </div>
  )
}

type StatProps = {
  icon: 'users' | 'chat'
  iconAccent: string
  iconBg: string
  label: string
  value: string
  valueAccent?: string
  valueSuffix?: string
  caption: string
}

function EngagementStat({
  icon,
  iconAccent,
  iconBg,
  label,
  value,
  valueAccent,
  valueSuffix,
  caption,
}: StatProps) {
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
        background: 'var(--lp-bg-warm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: iconBg,
            display: 'grid',
            placeItems: 'center',
            color: iconAccent,
          }}
        >
          <Icon name={icon} size={14} />
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600 }}>{label}</div>
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: valueAccent ?? 'var(--lp-ink)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
        {valueSuffix ? (
          <span style={{ fontSize: 13, color: 'var(--lp-ink-muted)' }}>
            {' '}
            {valueSuffix}
          </span>
        ) : null}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}>{caption}</div>
    </div>
  )
}

type Contact = {
  name: string
  subject: string
  elapsed: string
  status: string
  statusColor: string
}

const CONTACTS: Contact[] = [
  {
    name: 'Rivera family',
    subject: 'Re: weekly progress',
    elapsed: '12m',
    status: 'Replied',
    statusColor: 'var(--lp-green-ink)',
  },
  {
    name: 'O\u2019Brien family',
    subject: 'Conference scheduled',
    elapsed: '1h',
    status: 'Scheduled',
    statusColor: 'var(--lp-teal-ink)',
  },
  {
    name: 'Patel family',
    subject: 'Assignment Q: Algebra',
    elapsed: '3h',
    status: 'Open',
    statusColor: 'var(--lp-primary-ink)',
  },
]

function ContactRow({
  name,
  subject,
  elapsed,
  status,
  statusColor,
  divide,
}: Contact & { divide: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderTop: divide ? '1px solid var(--lp-border)' : 'none',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          background: 'var(--lp-bg-warm)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--lp-ink-3)',
        }}
      >
        {name[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}>{subject}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: statusColor }}>
        {status}
      </span>
      <span
        className="lp-mono"
        style={{ fontSize: 10, color: 'var(--lp-ink-hint)' }}
      >
        {elapsed}
      </span>
    </div>
  )
}
