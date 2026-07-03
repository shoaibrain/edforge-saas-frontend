/**
 * AttendanceInsightStrip — four mini metric cards summarising the at-risk cohort.
 *
 * Chronic absence (<70%, critical) · At-risk (70–90%, warn) · Declining (flagged
 * students trending down — the pre-emptive signal, info) · Lowest cohort (the
 * grade level with the worst rate, accent). Each carries a left accent rule; the
 * text label carries state, not colour alone. Bound to the deduped/banded
 * at-risk rows + grade-level rates derived from `useAttendanceOverview`.
 */

import { AlertTriangle, Flag, TrendingDown, Layers } from 'lucide-react'
import { useAcademicsI18n } from '../../../lib/i18n'
import type { GradeRateRow, RankedAlert } from './coverage'

type Tone = 'crit' | 'warn' | 'info' | 'accent'

const TONE: Record<
  Tone,
  { rule: string; chipBg: string; chipFg: string; valueFg: string }
> = {
  crit: {
    rule: 'bg-[rgb(var(--state-danger-fg))]',
    chipBg: 'bg-[rgb(var(--state-danger-bg)/0.4)]',
    chipFg: 'text-[rgb(var(--state-danger-fg))]',
    valueFg: 'text-[rgb(var(--state-danger-fg))]',
  },
  warn: {
    rule: 'bg-[rgb(var(--state-warning-fg))]',
    chipBg: 'bg-[rgb(var(--state-warning-bg)/0.4)]',
    chipFg: 'text-[rgb(var(--state-warning-fg))]',
    valueFg: 'text-[rgb(var(--text-primary))]',
  },
  info: {
    rule: 'bg-[rgb(var(--state-info-fg))]',
    chipBg: 'bg-[rgb(var(--state-info-bg)/0.4)]',
    chipFg: 'text-[rgb(var(--state-info-fg))]',
    valueFg: 'text-[rgb(var(--text-primary))]',
  },
  accent: {
    rule: 'bg-[rgb(var(--accent-attendance))]',
    chipBg: 'bg-[rgb(var(--accent-attendance)/0.12)]',
    chipFg: 'text-[rgb(var(--accent-attendance-text))]',
    valueFg: 'text-[rgb(var(--text-primary))]',
  },
}

interface AttendanceInsightStripProps {
  rankedAlerts: RankedAlert[]
  gradeRates: GradeRateRow[]
}

export function AttendanceInsightStrip({ rankedAlerts, gradeRates }: AttendanceInsightStripProps) {
  const { t, formatNumber } = useAcademicsI18n()

  const chronic = rankedAlerts.filter((a) => a.band === 'chronic').length
  const atrisk = rankedAlerts.filter((a) => a.band === 'atrisk').length
  const declining = rankedAlerts.filter((a) => a.trend === 'declining').length
  const lowest = gradeRates[0]

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <MiniCard
        tone="crit"
        icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        value={formatNumber(chronic)}
        label={t('attendance.dashboard.insight.chronicLabel')}
        sub={t('attendance.dashboard.insight.chronicSub')}
      />
      <MiniCard
        tone="warn"
        icon={<Flag className="h-4 w-4" aria-hidden="true" />}
        value={formatNumber(atrisk)}
        label={t('attendance.dashboard.insight.atRiskLabel')}
        sub={t('attendance.dashboard.insight.atRiskSub')}
      />
      <MiniCard
        tone="info"
        icon={<TrendingDown className="h-4 w-4" aria-hidden="true" />}
        value={formatNumber(declining)}
        label={t('attendance.dashboard.insight.decliningLabel')}
        sub={t('attendance.dashboard.insight.decliningSub')}
      />
      <MiniCard
        tone="accent"
        icon={<Layers className="h-4 w-4" aria-hidden="true" />}
        value={lowest ? `${formatNumber(Math.round(lowest.rate))}%` : '—'}
        label={t('attendance.dashboard.insight.lowestLabel')}
        sub={lowest ? t('attendance.dashboard.insight.lowestSub', { grade: lowest.gradeLevel }) : '—'}
      />
    </div>
  )
}

function MiniCard({
  tone,
  icon,
  value,
  label,
  sub,
}: {
  tone: Tone
  icon: React.ReactNode
  value: string
  label: string
  sub: string
}) {
  const c = TONE[tone]
  return (
    <div className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] p-4">
      <span className={`absolute inset-y-0 left-0 w-1 ${c.rule}`} aria-hidden="true" />
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.chipBg} ${c.chipFg}`}>{icon}</span>
      <div className="min-w-0">
        <div className={`text-xl font-bold leading-tight tabular-nums ${c.valueFg}`}>{value}</div>
        <div className="text-2xs font-semibold text-[rgb(var(--text-secondary))]">{label}</div>
        <div className="truncate text-3xs text-[rgb(var(--text-tertiary))]">{sub}</div>
      </div>
    </div>
  )
}
