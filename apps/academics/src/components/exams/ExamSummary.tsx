/**
 * ExamSummary — compact 5-tile filter strip above the Examinations table.
 *
 * Tiles are derived from the loaded `exams: ExamResponseDto[]` (no extra
 * API hit). The first four are click-to-filter — clicking one sets a
 * bucket on the parent which pre-filters the table data. The fifth tile
 * ("Result Readiness") is a read-only progress indicator with an inline
 * mint donut on the right.
 *
 * Visual: a single horizontal row of low-chrome tiles (~64–72px tall) so
 * the table itself stays above the fold. Replaces the original
 * `StatCard`-based design which was hero-tile sized and dominated the
 * first paint at the typical academics content-pane width.
 */

import { useMemo } from 'react'
import { CalendarClock, ClipboardList, Flag, PlayCircle, Target } from 'lucide-react'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { StatBand, type StatMetric } from '@edforge/ui'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * 'total' is the default "view all" state — selecting any other bucket
 * narrows the table; selecting Total resets back to the unfiltered view.
 * Total is never "off" (the prototype always highlights one tile).
 */
export type ExamBucket = 'total' | 'live' | 'upcoming' | 'awaiting'

export interface ExamSummaryProps {
  exams: ExamResponseDto[]
  isLoading?: boolean
  activeBucket: ExamBucket
  onBucketChange: (next: ExamBucket) => void
}

/** Apply the active bucket as a pre-filter over an exam list. */
export function filterExamsByBucket(
  exams: ExamResponseDto[],
  bucket: ExamBucket,
): ExamResponseDto[] {
  if (bucket === 'total') return exams
  const today = isoToday()
  if (bucket === 'live') return exams.filter((e) => e.status === 'in_progress')
  if (bucket === 'upcoming') {
    return exams.filter(
      (e) => e.status === 'scheduled' && (e.startDate ?? '') >= today,
    )
  }
  // awaiting
  return exams.filter(
    (e) =>
      e.status === 'closed' && e.resultGenerationStatus !== 'generated',
  )
}

/** Human label for the active bucket — used by the page-level filter chip. */
export function labelForBucket(bucket: Exclude<ExamBucket, 'total'>): string {
  if (bucket === 'live') return 'Live Now'
  if (bucket === 'upcoming') return 'Upcoming'
  return 'Awaiting Results'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExamSummary({
  exams,
  isLoading = false,
  activeBucket,
  onBucketChange,
}: ExamSummaryProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const summary = useMemo(
    () => computeSummary(exams, t, formatNumber),
    [exams, t, formatNumber],
  )

  // 'total' is the reset state — it's never toggled off. Any other bucket
  // toggles back to 'total' when re-clicked ("click the active filter to
  // return to all").
  const toggle = (bucket: ExamBucket) => {
    if (bucket === 'total') {
      onBucketChange('total')
      return
    }
    onBucketChange(activeBucket === bucket ? 'total' : bucket)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-24 items-stretch overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 border-s border-[rgb(var(--border-primary)/0.15)] px-5 py-4 first:border-s-0">
            <div className="h-3 w-20 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="mt-3 h-7 w-12 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
        ))}
      </div>
    )
  }

  const awaiting: StatMetric =
    summary.awaiting > 0
      ? {
          label: t('examModule.summary.awaiting'),
          value: formatNumber(summary.awaiting),
          icon: <Flag className="h-4 w-4" />,
          state: 'warn',
          pill: { tone: 'warn', text: t('examModule.summary.actionNeeded') },
          sub: t('examModule.summary.actionNeeded'),
          onClick: () => toggle('awaiting'),
          active: activeBucket === 'awaiting',
        }
      : {
          label: t('examModule.summary.awaiting'),
          value: formatNumber(summary.awaiting),
          icon: <Flag className="h-4 w-4" />,
          state: 'normal',
          sub: t('examModule.summary.allCaughtUp'),
          onClick: () => toggle('awaiting'),
          active: activeBucket === 'awaiting',
        }

  const readiness: StatMetric =
    summary.readinessTotal > 0
      ? {
          label: t('examModule.summary.readiness'),
          value: `${summary.readinessPercent}%`,
          icon: <Target className="h-4 w-4" />,
          state: 'normal',
          donut: { pct: summary.readinessPercent },
          sub: t('examModule.summary.generatedCount', {
            generated: formatNumber(summary.readinessGenerated),
            total: formatNumber(summary.readinessTotal),
          }),
        }
      : {
          label: t('examModule.summary.readiness'),
          value: `${summary.readinessPercent}%`,
          icon: <Target className="h-4 w-4" />,
          state: 'muted',
          sub: t('examModule.summary.noClosed'),
        }

  const metrics: StatMetric[] = [
    {
      label: t('examModule.summary.total'),
      value: formatNumber(summary.total),
      icon: <ClipboardList className="h-4 w-4" />,
      state: 'normal',
      primary: true,
      sub: t('examModule.summary.typeTermCount', {
        types: formatNumber(summary.typeCount),
        terms: formatNumber(summary.termCount),
      }),
      onClick: () => toggle('total'),
      active: activeBucket === 'total',
    },
    {
      label: t('examModule.summary.live'),
      value: formatNumber(summary.live),
      icon: <PlayCircle className="h-4 w-4" />,
      state: summary.live > 0 ? 'live' : 'muted',
      sub: summary.live > 0 ? t('examModule.summary.inSession') : t('examModule.summary.nothingLive'),
      onClick: () => toggle('live'),
      active: activeBucket === 'live',
    },
    {
      label: t('examModule.summary.upcoming'),
      value: formatNumber(summary.upcoming),
      icon: <CalendarClock className="h-4 w-4" />,
      state: 'info',
      sub: summary.nextHint,
      onClick: () => toggle('upcoming'),
      active: activeBucket === 'upcoming',
    },
    awaiting,
    readiness,
  ]

  return <StatBand metrics={metrics} ariaLabel={t('examModule.summary.total')} />
}

// ============================================================================
// DERIVATION
// ============================================================================

interface SummaryShape {
  total: number
  typeCount: number
  termCount: number
  live: number
  upcoming: number
  nextHint: string | undefined
  awaiting: number
  readinessPercent: number
  readinessGenerated: number
  readinessTotal: number
}

function computeSummary(
  exams: ExamResponseDto[],
  t: ReturnType<typeof useAcademicsI18n>['t'],
  formatNumber: ReturnType<typeof useAcademicsI18n>['formatNumber'],
): SummaryShape {
  const today = isoToday()

  const types = new Set<string>()
  const terms = new Set<string>()
  let live = 0
  let awaiting = 0
  let readinessGenerated = 0
  let readinessTotal = 0
  const upcomingExams: ExamResponseDto[] = []

  for (const exam of exams) {
    if (exam.examType) types.add(exam.examType)
    if (exam.termId) terms.add(exam.termId)
    if (exam.status === 'in_progress') live++
    if (
      exam.status === 'scheduled' &&
      (exam.startDate ?? '') >= today
    ) {
      upcomingExams.push(exam)
    }
    if (exam.status === 'closed') {
      readinessTotal++
      if (exam.resultGenerationStatus === 'generated') {
        readinessGenerated++
      } else {
        awaiting++
      }
    }
  }

  upcomingExams.sort((a, b) =>
    (a.startDate ?? '').localeCompare(b.startDate ?? ''),
  )
  const next = upcomingExams[0]
  const nextHint = next
    ? t('examModule.summary.nextHint', {
        examName: next.examName,
        days: formatNumber(daysFromTodayUntil(next.startDate)),
      })
    : exams.length > 0
      ? t('examModule.summary.noUpcoming')
      : undefined

  const readinessPercent = readinessTotal === 0
    ? 0
    : Math.round((readinessGenerated / readinessTotal) * 100)

  return {
    total: exams.length,
    typeCount: types.size,
    termCount: terms.size,
    live,
    upcoming: upcomingExams.length,
    nextHint,
    awaiting,
    readinessPercent,
    readinessGenerated,
    readinessTotal,
  }
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysFromTodayUntil(iso?: string): number {
  if (!iso) return 0
  const startMs = Date.parse(iso + 'T00:00:00Z')
  const todayMs = Date.parse(isoToday() + 'T00:00:00Z')
  if (Number.isNaN(startMs) || Number.isNaN(todayMs)) return 0
  return Math.max(0, Math.round((startMs - todayMs) / 86_400_000))
}
