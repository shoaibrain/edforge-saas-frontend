import { Icon } from '../../components/Icon'
import { Tag } from '@edforge/ui'

/**
 * TeacherDashboard — static mockup for the Teachers & Parents use-case
 * fallback. Shows Ms. Chen's parent-engagement dashboard.
 */
export function TeacherDashboard() {
  return (
    <div className="pt-[22px] pb-[22px] pl-[22px] pr-[22px] bg-[var(--lp-bg-elevated)]">
      <div
        className="mb-4"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            // allow-presentation-style: editorial 13px heading
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--lp-ink)' }}
          >
            Parent Engagement Dashboard
          </div>
          <div
            // allow-presentation-style: editorial 11.5px subtitle
            style={{ fontSize: 11.5, color: 'var(--lp-ink-muted)' }}
          >
            Ms. Chen · Room 214
          </div>
        </div>
        <Tag variant="green" dot>
          Live
        </Tag>
      </div>

      <div
        className="gap-2.5 mb-3"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
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
        className="p-3"
        style={{
          border: '1px solid var(--lp-border)',
          borderRadius: 12,
        }}
      >
        <div className="text-xs mb-2.5" style={{ fontWeight: 600 }}>
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
      className="p-3 bg-[var(--lp-bg-warm)]"
      style={{
        border: '1px solid var(--lp-border)',
        borderRadius: 12,
      }}
    >
      <div className="gap-2 mb-1.5" style={{ display: 'flex', alignItems: 'center' }}>
        <div
          // allow-presentation-style: per-stat data-driven icon bg + accent color
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
        <div
          // allow-presentation-style: editorial 11.5px label
          style={{ fontSize: 11.5, fontWeight: 600 }}
        >{label}</div>
      </div>
      <div
        // allow-presentation-style: editorial 24px value + data-driven accent color
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: valueAccent ?? 'var(--lp-ink)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
        {valueSuffix ? (
          <span
            // allow-presentation-style: editorial 13px suffix
            style={{ fontSize: 13, color: 'var(--lp-ink-muted)' }}
          >
            {' '}
            {valueSuffix}
          </span>
        ) : null}
      </div>
      <div
        // allow-presentation-style: editorial 10.5px caption
        style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}
      >{caption}</div>
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
      className="gap-2.5 pt-2 pb-2"
      style={{
        display: 'flex',
        alignItems: 'center',
        borderTop: divide ? '1px solid var(--lp-border)' : 'none',
      }}
    >
      <div
        aria-hidden
        // allow-presentation-style: editorial 10px monogram avatar
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
        <div className="text-xs" style={{ fontWeight: 600 }}>{name}</div>
        <div
          // allow-presentation-style: editorial 10.5px subject
          style={{ fontSize: 10.5, color: 'var(--lp-ink-muted)' }}
        >{subject}</div>
      </div>
      <span
        // allow-presentation-style: editorial 10px status + data-driven status color
        style={{ fontSize: 10, fontWeight: 600, color: statusColor }}
      >
        {status}
      </span>
      <span
        className="lp-mono"
        // allow-presentation-style: editorial 10px mono elapsed time
        style={{ fontSize: 10, color: 'var(--lp-ink-hint)' }}
      >
        {elapsed}
      </span>
    </div>
  )
}
