/**
 * PatternsRail — the w-5 stacked rail: a day-of-week recorded-rate pattern
 * (lowest weekday highlighted) and a grade-level rate comparison (worst-first,
 * tone by threshold). Both bind to `useAttendanceOverview`: the DOW card to
 * `dayOfWeekPattern`, the comparison to `todaySummary.byGradeLevel` (the honest
 * substitute for a per-section cohort rate, which no aggregate provides).
 */

import { CalendarDays, Layers } from 'lucide-react'
import { useAcademicsI18n } from '../../../lib/i18n'
import { WidgetShell } from './WidgetShell'
import type { GradeRateRow } from './coverage'

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface PatternsRailProps {
  dayOfWeekPattern?: Record<string, { avgRate: number; avgAbsent: number }>
  gradeRates: GradeRateRow[]
}

export function PatternsRail({ dayOfWeekPattern, gradeRates }: PatternsRailProps) {
  return (
    <div className="flex flex-col gap-4">
      <DowPatternCard pattern={dayOfWeekPattern} />
      <GradeComparisonCard gradeRates={gradeRates} />
    </div>
  )
}

function DowPatternCard({ pattern }: { pattern?: Record<string, { avgRate: number; avgAbsent: number }> }) {
  const { t } = useAcademicsI18n()
  const days = DAYS_ORDER.filter((d) => pattern?.[d] != null)
  if (!pattern || days.length === 0) {
    return (
      <WidgetShell
        icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
        title={t('attendance.dashboard.dowTitle')}
        subtitle={t('attendance.dashboard.dowSubtitle')}
      >
        <div className="py-6 text-center text-2xs text-[rgb(var(--text-tertiary))]">
          {t('attendance.dashboard.trendEmpty')}
        </div>
      </WidgetShell>
    )
  }
  const rates = days.map((d) => pattern[d].avgRate)
  const minRate = Math.min(...rates)
  const minDay = days[rates.indexOf(minRate)]

  return (
    <WidgetShell
      icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
      title={t('attendance.dashboard.dowTitle')}
      subtitle={t('attendance.dashboard.dowInsightShort', { day: t(`attendance.dashboard.daysShort.${minDay}`) })}
    >
      <div className="grid grid-cols-6 items-end gap-2" style={{ height: 120 }}>
        {days.map((day) => {
          const rate = pattern[day].avgRate
          const lowest = rate === minRate
          return (
            <div key={day} className="flex h-full flex-col items-center">
              <div className="relative w-full flex-1">
                <i
                  // allow-presentation-style: data-driven bar height + lowest-day emphasis
                  className={`absolute inset-x-0 bottom-0 rounded-t motion-safe:transition-[height] motion-safe:duration-500 ${lowest ? 'bg-[rgb(var(--state-warning-fg))]' : 'bg-[rgb(var(--state-success-fg))]'}`}
                  style={{ height: `${rate}%` }}
                />
              </div>
              <div className={`mt-1.5 text-3xs font-semibold tabular-nums ${lowest ? 'text-[rgb(var(--state-warning-fg))]' : 'text-[rgb(var(--text-secondary))]'}`}>
                {rate.toFixed(0)}%
              </div>
              <div className="text-3xs text-[rgb(var(--text-tertiary))]">{t(`attendance.dashboard.daysShort.${day}`)}</div>
            </div>
          )
        })}
      </div>
    </WidgetShell>
  )
}

function GradeComparisonCard({ gradeRates }: { gradeRates: GradeRateRow[] }) {
  const { t } = useAcademicsI18n()
  return (
    <WidgetShell
      icon={<Layers className="h-4 w-4" aria-hidden="true" />}
      title={t('attendance.dashboard.gradeCompareTitle')}
      subtitle={t('attendance.dashboard.gradeCompareSubtitle')}
    >
      {gradeRates.length === 0 ? (
        <div className="py-6 text-center text-2xs text-[rgb(var(--text-tertiary))]">
          {t('attendance.dashboard.gradeCompareEmpty')}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {gradeRates.map((g) => {
            const fill =
              g.rate >= 90
                ? 'bg-[rgb(var(--state-success-fg))]'
                : g.rate >= 80
                  ? 'bg-[rgb(var(--state-warning-fg))]'
                  : 'bg-[rgb(var(--state-danger-fg))]'
            return (
              <div key={g.gradeLevel} className="flex items-center gap-2.5">
                <span className="w-20 shrink-0 truncate text-2xs text-[rgb(var(--text-secondary))]">
                  {t('attendance.dashboard.gradeLabel', { grade: g.gradeLevel })}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--background-tertiary))]">
                  <i
                    // allow-presentation-style: data-driven rate bar width + threshold tone
                    className={`block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${fill}`}
                    style={{ width: `${Math.max(0, Math.min(100, g.rate))}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-2xs font-semibold tabular-nums text-[rgb(var(--text-secondary))]">
                  {g.rate.toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </WidgetShell>
  )
}
