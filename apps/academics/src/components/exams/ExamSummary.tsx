/**
 * ExamSummary — 5-card strip above the Examinations table.
 *
 * Cards are derived from the loaded `exams: ExamResponseDto[]` (no extra
 * API hit) and the first four are click-to-filter — clicking one sets a
 * bucket on the parent which pre-filters the table data. The fifth card
 * ("Result Readiness") is a read-only progress indicator.
 */

import { useMemo, type ReactNode } from 'react'
import {
  CalendarClock,
  ClipboardList,
  Flag,
  PlayCircle,
} from 'lucide-react'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { cn, StatCard, focusRing } from '@edforge/ui'

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * 'total' is the default "view all" state — selecting any other bucket
 * narrows the table; selecting Total resets back to the unfiltered view.
 * Total is never "off" (the prototype always highlights one card).
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
  const summary = useMemo(() => computeSummary(exams), [exams])

  // 'total' is the reset state — it's never toggled off. Any other bucket
  // toggles back to 'total' when re-clicked, matching the prototype's
  // "click the active filter to return to all" behaviour.
  const toggle = (bucket: ExamBucket) => {
    if (bucket === 'total') {
      onBucketChange('total')
      return
    }
    onBucketChange(activeBucket === bucket ? 'total' : bucket)
  }

  return (
    <nav
      aria-label="Exam summary filters"
      className="grid gap-3 grid-cols-2 lg:grid-cols-5"
    >
      <SummaryButton
        active={activeBucket === 'total'}
        onClick={() => toggle('total')}
        label="Total Exams"
      >
        <StatCard
          label="Total Exams"
          value={String(summary.total)}
          icon={ClipboardList}
          accentColor="rgba(15, 110, 86, 0.12)"
          iconColor="rgb(var(--action-primary-bg))"
          barColor="rgb(var(--action-primary-bg))"
          hint={`${summary.typeCount} type${summary.typeCount === 1 ? '' : 's'} · ${summary.termCount} term${summary.termCount === 1 ? '' : 's'}`}
          loading={isLoading}
        />
      </SummaryButton>

      <SummaryButton
        active={activeBucket === 'live'}
        onClick={() => toggle('live')}
        label="Live Now"
      >
        <StatCard
          label="Live Now"
          value={String(summary.live)}
          icon={PlayCircle}
          accentColor="rgba(29, 158, 117, 0.12)"
          iconColor="rgb(var(--state-success-fg))"
          barColor="rgb(var(--state-success-fg))"
          hint={summary.live > 0 ? 'Currently in session' : 'Nothing live'}
          loading={isLoading}
        />
      </SummaryButton>

      <SummaryButton
        active={activeBucket === 'upcoming'}
        onClick={() => toggle('upcoming')}
        label="Upcoming"
      >
        <StatCard
          label="Upcoming"
          value={String(summary.upcoming)}
          icon={CalendarClock}
          accentColor="rgba(55, 138, 221, 0.12)"
          iconColor="rgb(var(--accent-academics))"
          barColor="rgb(var(--accent-academics))"
          hint={summary.nextHint}
          loading={isLoading}
        />
      </SummaryButton>

      <SummaryButton
        active={activeBucket === 'awaiting'}
        onClick={() => toggle('awaiting')}
        label="Awaiting Results"
      >
        <StatCard
          label="Awaiting Results"
          value={String(summary.awaiting)}
          icon={Flag}
          accentColor="rgba(239, 159, 39, 0.12)"
          iconColor="rgb(var(--state-warning-fg))"
          barColor="rgb(var(--state-warning-fg))"
          tag={
            summary.awaiting > 0
              ? {
                  text: 'Action needed',
                  color: 'rgb(var(--state-warning-fg))',
                  bg: 'rgba(239, 159, 39, 0.12)',
                }
              : undefined
          }
          hint={summary.awaiting === 0 ? 'All caught up' : undefined}
          loading={isLoading}
        />
      </SummaryButton>

      <ReadinessCard
        percent={summary.readinessPercent}
        generated={summary.readinessGenerated}
        total={summary.readinessTotal}
        loading={isLoading}
      />
    </nav>
  )
}

// ============================================================================
// CLICKABLE WRAPPER
// ============================================================================

function SummaryButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Filter by ${label}`}
      className={cn(
        'rounded-xl text-left transition-shadow duration-150',
        'motion-reduce:transition-none',
        focusRing,
        active
          ? 'ring-2 ring-[var(--mint-border)] ring-offset-2 ring-offset-[rgb(var(--background-primary))]'
          : '',
      )}
    >
      {children}
    </button>
  )
}

// ============================================================================
// RESULT READINESS CARD
// ============================================================================

function ReadinessCard({
  percent,
  generated,
  total,
  loading,
}: {
  percent: number
  generated: number
  total: number
  loading: boolean
}) {
  // Read-only sibling of StatCard's visual; we render our own layout because
  // StatCard exposes no slot for a right-aligned visual element, and we want
  // the donut ring on the right side per the prototype.
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border p-4 bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]">
        <div className="h-3 w-32 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))] mb-2.5" />
        <div className="h-7 w-20 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))] mb-1.5" />
        <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border pt-4 px-4 pb-3 bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      role="status"
      aria-label={`Result Readiness: ${percent}% (${generated} of ${total} generated)`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))]">
            Result Readiness
          </span>
          <div className="mt-2.5 text-2xl font-semibold leading-none tracking-tight text-[rgb(var(--text-primary))] tabular-nums">
            {percent}%
          </div>
          <div className="mt-1.5 text-xs text-[rgb(var(--text-disabled))] tabular-nums">
            {generated}/{total} generated
          </div>
        </div>
        <ReadinessRing percent={percent} />
      </div>
      <div
        // allow-presentation-style: accent bar uses the prototype's `--mint`
        // alias; encoding it as a Tailwind class would require a brittle
        // arbitrary-value bracket reference.
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: 'var(--mint)' }}
      />
    </div>
  )
}

// Inline donut — we don't reuse `AttendanceDonutRing` because its color tiers
// (red <80, orange <90, green ≥90) are attendance-specific; readiness should
// always read as mint regardless of the completion ratio.
function ReadinessRing({ percent }: { percent: number }) {
  const size = 44
  const stroke = 4
  const half = size / 2
  const radius = half - stroke / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(percent, 100))
  const offset = circumference * (1 - clamped / 100)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block flex-shrink-0"
      aria-hidden
    >
      <circle
        cx={half}
        cy={half}
        r={radius}
        fill="none"
        stroke="rgb(var(--border-primary) / 0.35)"
        strokeWidth={stroke}
      />
      <circle
        cx={half}
        cy={half}
        r={radius}
        fill="none"
        stroke="var(--mint)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${half} ${half})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease-out' }}
      />
    </svg>
  )
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

function computeSummary(exams: ExamResponseDto[]): SummaryShape {
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
    ? `Next: ${next.examName} · in ${daysFromTodayUntil(next.startDate)}d`
    : exams.length > 0
      ? 'No upcoming exams'
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
