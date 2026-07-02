/**
 * SectionsToRecord — the operational core of the Attendance dashboard.
 *
 * Folds a weighted-coverage band into the widget head (big % covered today —
 * partials count their completion fraction, not 1 — a per-section segmented
 * tracker, a three-state legend, students-covered and rate-among-recorded), then
 * lists the in-scope sections actionable-first (partial → not-started →
 * recorded). Each row opens the recording drawer: recorded → view/edit, partial
 * → continue, not-started → record. Bound to `useAttendanceOverview`'s
 * per-section completion; enriched with the section roster for subject + teacher.
 */

import { useMemo } from 'react'
import { ClipboardCheck, Check, ArrowRight, Pencil } from 'lucide-react'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { Button } from '@edforge/ui'
import { getSubjectIcon } from '../../../utils/subject-icon'
import { getColorForSubjectArea } from '../../../lib/classroom-colors'
import { useAcademicsI18n } from '../../../lib/i18n'
import { sortActionableFirst, type CoverageSummary, type SectionCoverage } from './coverage'

interface SectionsToRecordProps {
  coverage: SectionCoverage[]
  summary: CoverageSummary
  sectionsById: Map<string, SectionResponseDto>
  dateLabel: string
  onRecord: (sectionId: string) => void
  loading?: boolean
}

export function SectionsToRecord({
  coverage,
  summary,
  sectionsById,
  dateLabel,
  onRecord,
  loading = false,
}: SectionsToRecordProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const rows = useMemo(() => sortActionableFirst(coverage), [coverage])

  const subLabel = useMemo(() => {
    const bits: string[] = []
    if (summary.notStarted > 0)
      bits.push(t('attendance.dashboard.sections.notStartedCount', { count: formatNumber(summary.notStarted) }))
    if (summary.partial > 0)
      bits.push(t('attendance.dashboard.sections.inProgressCount', { count: formatNumber(summary.partial) }))
    return bits.length
      ? t('attendance.dashboard.sections.pickToRecord', { parts: bits.join(' · ') })
      : t('attendance.dashboard.sections.allRecorded')
  }, [summary, t, formatNumber])

  if (loading) {
    return (
      <section className="rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] p-4">
        <div className="h-4 w-40 rounded bg-[rgb(var(--background-tertiary))]" />
        <div className="mt-4 h-6 w-full rounded bg-[rgb(var(--background-tertiary))]" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[rgb(var(--background-tertiary))]" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]">
      {/* Head */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-[rgb(var(--text-secondary))]" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('attendance.dashboard.sections.title')}
            </div>
            <div className="text-2xs text-[rgb(var(--text-tertiary))]">
              {dateLabel} · {subLabel}
            </div>
          </div>
        </div>
        <span className="whitespace-nowrap text-2xs font-medium text-[rgb(var(--text-tertiary))]">
          {t('attendance.dashboard.sections.complete', {
            done: formatNumber(summary.full),
            total: formatNumber(summary.sectionCount),
          })}
        </span>
      </div>

      {/* Coverage band */}
      <div className="mx-4 mt-3 flex flex-wrap items-center gap-6 border-b border-[rgb(var(--border-primary)/0.3)] pb-4">
        <div className="flex flex-col">
          <span className="text-3xl font-bold leading-none tabular-nums text-[rgb(var(--text-primary))]">
            {formatNumber(summary.covWeightedPct)}
            <span className="ml-0.5 text-lg font-semibold text-[rgb(var(--text-tertiary))]">%</span>
          </span>
          <span className="mt-1 whitespace-nowrap text-2xs text-[rgb(var(--text-tertiary))]">
            {t('attendance.dashboard.sections.coveredToday')}
          </span>
        </div>

        {/* Segmented coverage tracker */}
        <div className="flex min-w-48 flex-1 flex-col gap-2">
          <div className="flex h-6 gap-1" role="img" aria-label={t('attendance.dashboard.sections.trackerAria', {
            full: formatNumber(summary.full),
            partial: formatNumber(summary.partial),
            none: formatNumber(summary.notStarted),
          })}>
            {rows.map((c) => (
              <CoverageSegment key={c.sectionId} coverage={c} label={sectionLabel(c, t)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <LegendSwatch tone="full" label={t('attendance.dashboard.sections.legendFull', { count: formatNumber(summary.full) })} />
            <LegendSwatch tone="partial" label={t('attendance.dashboard.sections.legendPartial', { count: formatNumber(summary.partial) })} />
            <LegendSwatch tone="none" label={t('attendance.dashboard.sections.legendNone', { count: formatNumber(summary.notStarted) })} />
          </div>
        </div>

        {/* Inline stats */}
        <div className="flex">
          <div className="flex flex-col gap-0.5 pr-4">
            <span className="text-lg font-bold leading-none tabular-nums text-[rgb(var(--text-primary))]">
              {formatNumber(summary.studentsRecorded)}
              <span className="text-sm font-medium text-[rgb(var(--text-tertiary))]">/{formatNumber(summary.studentsTotal)}</span>
            </span>
            <span className="text-2xs text-[rgb(var(--text-tertiary))]">{t('attendance.dashboard.sections.studentsCovered')}</span>
          </div>
          <div className="flex flex-col gap-0.5 border-l border-[rgb(var(--border-primary)/0.3)] pl-4">
            <span className="text-lg font-bold leading-none tabular-nums text-[rgb(var(--state-success-fg))]">
              {formatNumber(Math.round(summary.recordedRate))}%
            </span>
            <span className="text-2xs text-[rgb(var(--text-tertiary))]">{t('attendance.dashboard.sections.rateAmongRecorded')}</span>
          </div>
        </div>
      </div>

      {/* Section list */}
      <div className="px-4 pb-2">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-[rgb(var(--text-tertiary))]">
            {t('attendance.dashboard.sections.emptyScope')}
          </div>
        ) : (
          rows.map((c) => {
            const section = sectionsById.get(c.sectionId)
            const color = getColorForSubjectArea(section?.subjectArea)
            const SubjectIcon = section?.subjectArea ? getSubjectIcon(section.subjectArea) : ClipboardCheck
            const teacher = section?.primaryTeacherName
            return (
              <div
                key={c.sectionId}
                className={`flex items-center gap-3 border-b border-[rgb(var(--border-primary)/0.15)] py-2.5 last:border-b-0 ${c.status === 'recorded' ? 'opacity-80' : ''}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text} ${c.status === 'partial' ? 'ring-2 ring-[rgb(var(--state-warning-border)/0.5)]' : ''}`}
                >
                  <SubjectIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                    {c.courseName} — {c.sectionNumber}
                  </div>
                  <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">
                    {t('attendance.dashboard.sections.enrolledCount', { count: formatNumber(c.studentCount) })}
                    {teacher ? ` · ${teacher}` : ''}
                  </div>
                </div>
                <SectionAction coverage={c} onRecord={onRecord} />
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function sectionLabel(
  c: SectionCoverage,
  t: ReturnType<typeof useAcademicsI18n>['t'],
): string {
  const name = `${c.courseName} — ${c.sectionNumber}`
  const status =
    c.status === 'recorded'
      ? t('attendance.dashboard.sections.statusRecorded')
      : c.status === 'partial'
        ? t('attendance.dashboard.sections.statusPartial', { pct: c.completionPct })
        : t('attendance.dashboard.sections.statusNotRecorded')
  return `${name} · ${status}`
}

function CoverageSegment({ coverage, label }: { coverage: SectionCoverage; label: string }) {
  const toneBorder =
    coverage.status === 'recorded'
      ? 'border-transparent'
      : coverage.status === 'partial'
        ? 'border-[rgb(var(--state-warning-border)/0.6)]'
        : 'border-[rgb(var(--border-primary)/0.35)]'
  const fillColor =
    coverage.status === 'recorded'
      ? 'rgb(var(--state-success-fg))'
      : coverage.status === 'partial'
        ? 'rgb(var(--state-warning-fg))'
        : 'transparent'
  return (
    <span
      className={`relative flex-1 overflow-hidden rounded border bg-[rgb(var(--background-tertiary))] ${toneBorder}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <i
        // allow-presentation-style: data-driven coverage fill height + tone
        className="absolute inset-x-0 bottom-0 rounded-b motion-safe:transition-[height] motion-safe:duration-500"
        style={{ height: `${coverage.status === 'recorded' ? 100 : coverage.completionPct}%`, background: fillColor }}
      />
    </span>
  )
}

function LegendSwatch({ tone, label }: { tone: 'full' | 'partial' | 'none'; label: string }) {
  const cls =
    tone === 'full'
      ? 'bg-[rgb(var(--state-success-fg))] border-transparent'
      : tone === 'partial'
        ? 'bg-[rgb(var(--state-warning-fg))] border-transparent'
        : 'bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)]'
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs text-[rgb(var(--text-tertiary))]">
      <span className={`h-2.5 w-2.5 rounded-sm border ${cls}`} aria-hidden="true" />
      {label}
    </span>
  )
}

function SectionAction({
  coverage,
  onRecord,
}: {
  coverage: SectionCoverage
  onRecord: (sectionId: string) => void
}) {
  const { t, formatNumber } = useAcademicsI18n()
  if (coverage.status === 'recorded') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--state-success-bg)/0.4)] px-2.5 py-1 text-2xs font-semibold text-[rgb(var(--state-success-fg))]">
          <Check className="h-3 w-3" aria-hidden="true" />
          {t('attendance.dashboard.sections.recordedBadge')}
        </span>
        <Button size="sm" variant="outline" onClick={() => onRecord(coverage.sectionId)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          {t('attendance.dashboard.sections.viewEdit')}
        </Button>
      </div>
    )
  }
  if (coverage.status === 'partial') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="hidden whitespace-nowrap text-2xs text-[rgb(var(--state-warning-fg))] sm:inline">
          {t('attendance.dashboard.sections.partialCounts', {
            done: formatNumber(coverage.recordedCount),
            total: formatNumber(coverage.studentCount),
            left: formatNumber(Math.max(0, coverage.studentCount - coverage.recordedCount)),
          })}
        </span>
        <span className="inline-flex items-center rounded-full bg-[rgb(var(--state-warning-bg)/0.4)] px-2.5 py-1 text-2xs font-semibold text-[rgb(var(--state-warning-fg))]">
          {t('attendance.dashboard.sections.partialBadge', { pct: coverage.completionPct })}
        </span>
        <Button size="sm" onClick={() => onRecord(coverage.sectionId)}>
          {t('attendance.dashboard.sections.continue')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    )
  }
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <span className="inline-flex items-center rounded-full bg-[rgb(var(--background-tertiary))] px-2.5 py-1 text-2xs font-medium text-[rgb(var(--text-tertiary))]">
        {t('attendance.dashboard.sections.notStartedBadge')}
      </span>
      <Button size="sm" onClick={() => onRecord(coverage.sectionId)}>
        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {t('attendance.dashboard.sections.record')}
      </Button>
    </div>
  )
}
