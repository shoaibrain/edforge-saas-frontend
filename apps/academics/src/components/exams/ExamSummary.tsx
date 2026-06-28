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

import { useMemo, type ReactNode } from 'react'
import {
  CalendarClock,
  ClipboardList,
  Flag,
  PlayCircle,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { cn, focusRing } from '@edforge/ui'

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
      className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
    >
      <SummaryButton
        active={activeBucket === 'total'}
        onClick={() => toggle('total')}
        label="Total Exams"
      >
        <CompactTile
          icon={ClipboardList}
          label="Total Exams"
          value={summary.total}
          sub={`${summary.typeCount} type${summary.typeCount === 1 ? '' : 's'} · ${summary.termCount} term${summary.termCount === 1 ? '' : 's'}`}
          loading={isLoading}
        />
      </SummaryButton>

      <SummaryButton
        active={activeBucket === 'live'}
        onClick={() => toggle('live')}
        label="Live Now"
      >
        <CompactTile
          icon={PlayCircle}
          label="Live Now"
          value={summary.live}
          sub={summary.live > 0 ? 'In session' : 'Nothing live'}
          loading={isLoading}
        />
      </SummaryButton>

      <SummaryButton
        active={activeBucket === 'upcoming'}
        onClick={() => toggle('upcoming')}
        label="Upcoming"
      >
        <CompactTile
          icon={CalendarClock}
          label="Upcoming"
          value={summary.upcoming}
          sub={summary.nextHint}
          loading={isLoading}
        />
      </SummaryButton>

      <SummaryButton
        active={activeBucket === 'awaiting'}
        onClick={() => toggle('awaiting')}
        label="Awaiting Results"
      >
        <CompactTile
          icon={Flag}
          label="Awaiting Results"
          value={summary.awaiting}
          sub={summary.awaiting === 0 ? 'All caught up' : 'Action needed'}
          emphasize={summary.awaiting > 0 ? 'warning' : undefined}
          loading={isLoading}
        />
      </SummaryButton>

      {/* Result Readiness — read-only, not wrapped in SummaryButton. */}
      <CompactTile
        icon={Target}
        label="Result Readiness"
        value={`${summary.readinessPercent}%`}
        sub={
          summary.readinessTotal === 0
            ? 'No closed exams'
            : `${summary.readinessGenerated}/${summary.readinessTotal} generated`
        }
        rightSlot={
          summary.readinessTotal > 0 ? (
            <ReadinessRing percent={summary.readinessPercent} />
          ) : undefined
        }
        loading={isLoading}
        ariaLabel={`Result Readiness: ${summary.readinessPercent}% (${summary.readinessGenerated} of ${summary.readinessTotal} generated)`}
      />
    </nav>
  )
}

// ============================================================================
// COMPACT TILE
// ============================================================================

interface CompactTileProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  sub?: ReactNode
  /** Tints the value text — currently only 'warning' (used for Awaiting Results). */
  emphasize?: 'warning'
  /** Optional visual rendered on the right edge (e.g. the readiness ring). */
  rightSlot?: ReactNode
  loading?: boolean
  /** Overrides the auto-generated aria-label for screen readers. */
  ariaLabel?: string
}

function CompactTile({
  icon: Icon,
  label,
  value,
  sub,
  emphasize,
  rightSlot,
  loading,
  ariaLabel,
}: CompactTileProps) {
  if (loading) {
    return (
      <div className="h-11 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] px-3 flex items-center">
        <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      </div>
    )
  }

  const valueClass = cn(
    'text-xl font-semibold leading-none tabular-nums',
    emphasize === 'warning'
      ? 'text-[rgb(var(--state-warning-fg))]'
      : 'text-[rgb(var(--text-primary))]',
  )

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]"
      role="status"
      aria-label={ariaLabel ?? `${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}`}
    >
      <Icon className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] flex-shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-3xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))] truncate">
          {label}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className={valueClass}>{value}</span>
          {sub != null && (
            <span className="text-2xs text-[rgb(var(--text-tertiary))] truncate">
              {sub}
            </span>
          )}
        </div>
      </div>
      {rightSlot}
    </div>
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
        'rounded-lg text-left transition-colors duration-150',
        'motion-reduce:transition-none',
        focusRing,
        // Active state: thin mint outline + soft mint fill, no offset ring.
        active && 'ring-1 ring-[var(--mint-border)] [&>div]:bg-[var(--mint-soft)]',
      )}
    >
      {children}
    </button>
  )
}

// ============================================================================
// READINESS RING (inline donut — see comment below for why not reused)
// ============================================================================

// We don't reuse `AttendanceDonutRing` because its color tiers
// (red <80, orange <90, green ≥90) are attendance-specific; readiness should
// always read as mint regardless of the completion ratio.
function ReadinessRing({ percent }: { percent: number }) {
  const size = 28
  const stroke = 3
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
      ? 'No upcoming'
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
