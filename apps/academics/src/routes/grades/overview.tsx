/**
 * Grade Analytics — school-wide, focused view.
 *
 * Opens in place of the gradebook grid (Back returns). Composes the shipped
 * dashboard primitives — StatBand · WidgetGrid/WidgetCard · Ring donut ·
 * AnimatedProgressBar bars · StatusPill — instead of bespoke SVG.
 *
 * Honest-data treatment (the whole point of the redesign):
 *  - An insight callout reframes why the pass rate is deflated / at-risk inflated
 *    by ungraded work (students with no grade read as 0%).
 *  - At-risk students are DEDUPED by studentId (the API repeats per course) and
 *    tagged Failing / Below-pass / Not-graded, filterable + height-capped.
 *  - Summative is shown honestly as "none yet" when there are no summative items
 *    — no misleading "% higher than summative" comparison against zero.
 *
 * Data source: the school-wide `useGradeOverview` aggregate. All transforms are
 * client-side; no write path. Presentation only.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { ChevronLeft, Download, Info } from 'lucide-react'
import { useResourcePermissions } from '@edforge/abac'
import {
  StatBand,
  type StatMetric,
  WidgetGrid,
  WidgetCard,
  Ring,
  StatusPill,
  AnimatedProgressBar,
  SegmentedControl,
} from '@edforge/ui'
import { useGradeOverview } from '../../hooks/useGrades'
import { useAcademicsI18n } from '../../lib/i18n'
import type { GradeOverviewResponse } from '../../services/academics.service'

// ============================================================================
// TYPES + CONSTANTS
// ============================================================================

interface PolicyWeight {
  categoryId: string
  categoryName: string
  weight: number
}

interface GradeOverviewProps {
  schoolId: string
  academicYearId: string
  policyWeights?: PolicyWeight[]
  /** When provided, renders a "Back to gradebook" control (analytics-in-place). */
  onBack?: () => void
}

type AtRiskStudent = GradeOverviewResponse['atRiskStudents'][number]
type AtRiskTag = 'failing' | 'below-pass' | 'not-graded'
type TaggedAtRisk = AtRiskStudent & { tag: AtRiskTag }

// Failing threshold = the default minimum passing grade (PABSON). Pass target
// for the KPI meter = 60%. Neither is in the payload, so they're constants here.
const MIN_PASSING = 35
const PASS_TARGET = 60

const DIST_LETTERS = ['A', 'B', 'C', 'D', 'F']
const DIST_COLOR: Record<string, string> = {
  A: 'rgb(var(--state-success-fg))',
  B: 'rgb(var(--state-info-fg))',
  C: 'rgb(var(--state-warning-fg))',
  D: 'rgb(var(--text-tertiary))',
  F: 'rgb(var(--state-danger-fg))',
}

const CATEGORY_COLORS = [
  'rgb(var(--state-success-fg))',
  'rgb(var(--state-info-fg))',
  'rgb(var(--action-primary-bg))',
  'rgb(var(--state-warning-fg))',
  'rgb(var(--state-danger-fg))',
]

// avg/pass tone: mint ≥60 · amber ≥40 · critical <40
function toneText(pct: number): string {
  if (pct >= 60) return 'text-[rgb(var(--state-success-fg))]'
  if (pct >= 40) return 'text-[rgb(var(--state-warning-fg))]'
  return 'text-[rgb(var(--state-danger-fg))]'
}
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

// ============================================================================
// CSV EXPORT (preserved)
// ============================================================================

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportGradebookCsv(data: GradeOverviewResponse, schoolId: string) {
  const header = 'Course,Sections,Students,Avg Grade,Avg GPA,Pass Rate\n'
  const rows = data.coursePerformance
    .map((c) => `"${c.courseName}",${c.sectionCount},${c.studentCount},${c.avgGrade.toFixed(1)}%,${c.avgGpa.toFixed(2)},${c.passRate.toFixed(1)}%`)
    .join('\n')
  downloadCsv(header + rows, `gradebook-overview-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`)
}

function exportAtRiskCsv(students: TaggedAtRisk[], schoolId: string) {
  const header = 'Student Name,Course,Status,Numeric Grade,Letter Grade\n'
  const rows = students
    .map((s) => `"${s.studentName}","${s.courseName}",${s.tag},${s.numericGrade.toFixed(1)},${s.letterGrade ?? ''}`)
    .join('\n')
  downloadCsv(header + rows, `at-risk-students-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`)
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GradeOverview({ schoolId, academicYearId, policyWeights, onBack }: GradeOverviewProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const gradePerms = useResourcePermissions('grades')
  const { data, isLoading, isError } = useGradeOverview(schoolId, academicYearId)

  const [arFilter, setArFilter] = useState<'all' | 'graded' | 'pending'>('all')
  const atRiskRef = useRef<HTMLDivElement>(null)

  // Dedupe at-risk by studentId (the API repeats a student once per course),
  // preferring the entry that carries a real letter grade; then tag each.
  const atRisk = useMemo<TaggedAtRisk[]>(() => {
    const raw = data?.atRiskStudents ?? []
    const byId = new Map<string, AtRiskStudent>()
    for (const s of raw) {
      const existing = byId.get(s.studentId)
      if (!existing || (existing.letterGrade == null && s.letterGrade != null)) byId.set(s.studentId, s)
    }
    return Array.from(byId.values()).map((s) => {
      let tag: AtRiskTag
      if (s.letterGrade == null) tag = 'not-graded'
      else if (s.numericGrade < MIN_PASSING) tag = 'failing'
      else tag = 'below-pass'
      return { ...s, tag }
    })
  }, [data])

  const rawFlagCount = data?.atRiskStudents.length ?? 0
  const gradedAtRisk = atRisk.filter((s) => s.tag !== 'not-graded')
  const pendingAtRisk = atRisk.filter((s) => s.tag === 'not-graded')
  const visibleAtRisk =
    arFilter === 'graded' ? gradedAtRisk : arFilter === 'pending' ? pendingAtRisk : atRisk

  const distBars = useMemo(() => {
    const dist = data?.gradeDistribution ?? []
    const total = data?.totalStudentsGraded ?? 0
    return dist.map((d, i) => ({
      letter: DIST_LETTERS[i] || 'F',
      count: d.count,
      pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }))
  }, [data])

  const sortedCourses = useMemo(
    () => [...(data?.coursePerformance ?? [])].sort((a, b) => b.avgGrade - a.avgGrade),
    [data],
  )

  const reviewPending = useCallback(() => {
    setArFilter('pending')
    atRiskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleExport = useCallback(() => {
    if (data && data.coursePerformance.length > 0) exportGradebookCsv(data, schoolId)
  }, [data, schoolId])

  // ── Scope header (Back · title · scope · Export) ─────────────────────────
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('gradesModule.overview.backToGradebook')}
          </button>
        )}
        <div>
          <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
            {t('gradesModule.overview.title')}
          </h3>
          {data && (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('gradesModule.overview.scope', {
                graded: formatNumber(data.sectionsWithGrades),
                total: formatNumber(data.totalSections),
              })}
            </p>
          )}
        </div>
      </div>
      {gradePerms.view && data && data.coursePerformance.length > 0 && (
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] px-3 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
        >
          <Download className="h-4 w-4" />
          {t('gradesModule.overview.actions.export')}
        </button>
      )}
    </div>
  )

  if (isError) {
    return (
      <div className="space-y-5">
        {header}
        <div className="rounded-xl border border-[rgb(var(--state-danger-border))] bg-[rgb(var(--state-danger-bg))] p-6 text-center text-sm text-[rgb(var(--state-danger-fg))]">
          {t('gradesModule.overview.error')}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[rgb(var(--background-tertiary))]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-[rgb(var(--background-tertiary))]" />
      </div>
    )
  }

  if (!data || data.totalStudentsGraded === 0) {
    return (
      <div className="space-y-5">
        {header}
        <div className="rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] p-12 text-center">
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('gradesModule.overview.emptyState.title')}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
            {t('gradesModule.overview.emptyState.description')}
          </p>
        </div>
      </div>
    )
  }

  // ── KPI band ─────────────────────────────────────────────────────────────
  const passState = data.passRate >= PASS_TARGET ? 'good' : data.passRate >= 40 ? 'warn' : 'critical'
  const metrics: StatMetric[] = [
    {
      label: t('gradesModule.overview.kpis.studentsGraded'),
      value: formatNumber(data.totalStudentsGraded),
      iconSignature: 'students',
      state: 'normal',
      primary: true,
      sub: t('gradesModule.overview.scope', {
        graded: formatNumber(data.sectionsWithGrades),
        total: formatNumber(data.totalSections),
      }),
    },
    {
      label: t('gradesModule.overview.kpis.averageGpa'),
      value: data.averageGpa.toFixed(2),
      iconSignature: 'gpa',
      state: 'normal',
      sub: t('gradesModule.overview.kpis.avgGradeHint', { grade: formatNumber(Math.round(data.averageGrade)) }),
    },
    {
      label: t('gradesModule.overview.kpis.passRate'),
      value: `${formatNumber(Math.round(data.passRate))}%`,
      iconSignature: 'overview',
      state: passState,
      meter: { pct: data.passRate, target: PASS_TARGET },
      sub: t('gradesModule.overview.kpis.passRateHint'),
    },
    data.atRiskCount > 0
      ? {
          label: t('gradesModule.overview.kpis.atRisk'),
          value: formatNumber(data.atRiskCount),
          iconSignature: 'atrisk',
          state: 'critical',
          pill: { tone: 'critical', text: t('gradesModule.overview.kpis.belowThreshold') },
          sub: t('gradesModule.overview.kpis.needSupport'),
        }
      : {
          label: t('gradesModule.overview.kpis.atRisk'),
          value: formatNumber(data.atRiskCount),
          iconSignature: 'atrisk',
          state: 'muted',
          sub: t('gradesModule.overview.kpis.needSupport'),
        },
  ]

  // ── Insight callout numbers ──────────────────────────────────────────────
  const ungradedStubs = data.gradingProgress?.ungradedStubs ?? 0
  const totalEntries = data.gradingProgress?.totalAssignmentEntries ?? 0
  const showInsight = pendingAtRisk.length > 0 || ungradedStubs > 0

  const summative = data.assessmentBreakdown?.summative
  const formative = data.assessmentBreakdown?.formative
  const hasSummative = (summative?.count ?? 0) > 0

  return (
    <div className="space-y-5">
      {header}

      {/* Insight callout — reframes the depressed pass rate / inflated at-risk. */}
      {showInsight && (
        <div className="flex items-start gap-3 rounded-xl border border-[rgb(var(--state-info-border)/0.5)] bg-[rgb(var(--state-info-bg)/0.35)] px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--state-info-fg))]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              {t('gradesModule.overview.insight.body', {
                pending: formatNumber(pendingAtRisk.length),
                unique: formatNumber(atRisk.length),
                ungraded: formatNumber(ungradedStubs),
                totalEntries: formatNumber(totalEntries),
                passRate: formatNumber(Math.round(data.passRate)),
              })}
            </p>
            {pendingAtRisk.length > 0 && (
              <button
                type="button"
                onClick={reviewPending}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[rgb(var(--state-info-fg))] hover:underline"
              >
                {t('gradesModule.overview.insight.reviewPending')}
              </button>
            )}
          </div>
        </div>
      )}

      <StatBand metrics={metrics} ariaLabel={t('gradesModule.overview.title')} />

      <WidgetGrid>
        {/* Grading Completion */}
        <WidgetCard
          title={t('gradesModule.overview.completion.title')}
          subtitle={t('gradesModule.overview.completion.subtitle')}
          iconSignature="overview"
          span={5}
        >
          {data.gradingProgress ? (
            <div className="flex items-center gap-5">
              <div className="relative inline-flex items-center justify-center">
                <Ring
                  percentage={data.gradingProgress.completionRate}
                  size={116}
                  strokeWidth={10}
                  color="rgb(var(--state-success-fg))"
                  label={t('gradesModule.overview.completion.title')}
                />
                <div className="absolute text-center">
                  <div className="text-xl font-bold text-[rgb(var(--text-primary))]">
                    {formatNumber(Math.round(data.gradingProgress.completionRate))}%
                  </div>
                  <div className="text-2xs text-[rgb(var(--text-tertiary))]">
                    {t('gradesModule.overview.completion.gradedShort')}
                  </div>
                </div>
              </div>
              <div className="min-w-0 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-[rgb(var(--text-secondary))]">
                  <span className="h-2 w-2 rounded-full bg-[rgb(var(--state-success-fg))]" />
                  {t('gradesModule.overview.completion.gradedCount', {
                    count: formatNumber(data.gradingProgress.gradedEntries),
                  })}
                </div>
                <div className="flex items-center gap-2 text-[rgb(var(--text-tertiary))]">
                  <span className="h-2 w-2 rounded-full bg-[rgb(var(--border-primary)/0.5)]" />
                  {t('gradesModule.overview.completion.remainingCount', {
                    count: formatNumber(data.gradingProgress.ungradedStubs),
                  })}
                </div>
                <div className="pt-1 text-[rgb(var(--text-tertiary))]">
                  {t('gradesModule.overview.completion.total', {
                    count: formatNumber(data.gradingProgress.totalAssignmentEntries),
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('gradesModule.overview.noData')}</p>
          )}
        </WidgetCard>

        {/* Assessment Performance — honest summative-zero */}
        <WidgetCard
          title={t('gradesModule.overview.assessment.title')}
          subtitle={t('gradesModule.overview.assessment.subtitle')}
          iconSignature="academics"
          span={7}
        >
          <div className="flex flex-wrap items-start gap-8">
            <div>
              <div className="text-2xl font-bold text-[rgb(var(--state-success-fg))]">
                {formatNumber(Math.round(formative?.avgScore ?? 0))}%
              </div>
              <div className="max-w-40 text-xs text-[rgb(var(--text-tertiary))]">
                {t('gradesModule.overview.assessment.formative', { count: formatNumber(formative?.count ?? 0) })}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[rgb(var(--text-tertiary))]">
                {hasSummative ? `${formatNumber(Math.round(summative?.avgScore ?? 0))}%` : t('gradesModule.overview.assessment.noneYet')}
              </div>
              <div className="max-w-40 text-xs text-[rgb(var(--text-tertiary))]">
                {t('gradesModule.overview.assessment.summative', { count: formatNumber(summative?.count ?? 0) })}
              </div>
            </div>
            <p className="flex-1 self-center text-xs text-[rgb(var(--text-tertiary))]">
              {hasSummative
                ? t('gradesModule.overview.assessment.noteBalanced')
                : t('gradesModule.overview.assessment.noteNoSummative')}
            </p>
          </div>
        </WidgetCard>

        {/* Grade Distribution */}
        <WidgetCard
          title={t('gradesModule.overview.distribution.title')}
          subtitle={t('gradesModule.overview.distribution.subtitle')}
          iconSignature="gradelevels"
          span={12}
          metric={t('gradesModule.overview.distribution.metric', { count: formatNumber(data.totalStudentsGraded) })}
          footer={
            <span className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('gradesModule.overview.distribution.note')}
            </span>
          }
        >
          <div className="space-y-2.5">
            {distBars.map((d) => (
              <div key={d.letter} className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-[rgb(var(--text-secondary))]">{d.letter}</span>
                <div className="flex-1">
                  <AnimatedProgressBar
                    percentage={d.pct}
                    color={DIST_COLOR[d.letter] ?? 'rgb(var(--text-tertiary))'}
                    label={`${d.letter}: ${d.count}`}
                    height={8}
                  />
                </div>
                <span className="w-20 text-right text-xs tabular-nums text-[rgb(var(--text-secondary))]">
                  {formatNumber(d.count)} · {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </WidgetCard>

        {/* Course Performance */}
        <WidgetCard
          title={t('gradesModule.overview.courses.title')}
          subtitle={t('gradesModule.overview.courses.subtitle')}
          iconSignature="curriculum"
          span={7}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary)/0.25)] text-left text-2xs uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
                  <th className="pb-2 font-medium">{t('gradesModule.overview.courses.course')}</th>
                  <th className="pb-2 text-center font-medium">{t('gradesModule.overview.courses.sections')}</th>
                  <th className="pb-2 text-center font-medium">{t('gradesModule.overview.courses.students')}</th>
                  <th className="pb-2 text-right font-medium">{t('gradesModule.overview.courses.avg')}</th>
                  <th className="pb-2 text-right font-medium">{t('gradesModule.overview.courses.gpa')}</th>
                  <th className="pb-2 text-right font-medium">{t('gradesModule.overview.courses.pass')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-primary)/0.15)]">
                {sortedCourses.map((c) => (
                  <tr key={c.courseId}>
                    <td className="py-2 pr-2 text-[rgb(var(--text-primary))]">{c.courseName}</td>
                    <td className="py-2 text-center tabular-nums text-[rgb(var(--text-secondary))]">{formatNumber(c.sectionCount)}</td>
                    <td className="py-2 text-center tabular-nums text-[rgb(var(--text-secondary))]">{formatNumber(c.studentCount)}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${toneText(c.avgGrade)}`}>{c.avgGrade.toFixed(1)}%</td>
                    <td className="py-2 text-right tabular-nums text-[rgb(var(--text-secondary))]">{c.avgGpa.toFixed(2)}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${toneText(c.passRate)}`}>{c.passRate.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        {/* Category Performance */}
        <WidgetCard
          title={t('gradesModule.overview.categories.title')}
          subtitle={t('gradesModule.overview.categories.subtitle')}
          iconSignature="sections"
          span={5}
          state={data.categoryPerformance && data.categoryPerformance.length > 0 ? 'ready' : 'empty'}
          empty={{ title: t('gradesModule.overview.categories.empty') }}
        >
          <div className="space-y-3">
            {(data.categoryPerformance ?? []).map((cat, i) => {
              const weight = policyWeights?.find((w) => w.categoryId === cat.categoryId)?.weight
              return (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[rgb(var(--text-secondary))]">
                      {cat.categoryName}
                      {weight != null ? <span className="text-[rgb(var(--text-tertiary))]"> · {formatNumber(weight)}%</span> : null}
                    </span>
                    <span className="font-semibold tabular-nums text-[rgb(var(--text-primary))]">
                      {formatNumber(Math.round(cat.avgScore))}% <span className="font-normal text-[rgb(var(--text-tertiary))]">({formatNumber(cat.assignmentCount)})</span>
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percentage={cat.avgScore}
                    color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    label={`${cat.categoryName}: ${Math.round(cat.avgScore)}%`}
                    height={6}
                  />
                </div>
              )
            })}
          </div>
        </WidgetCard>

        {/* At-Risk Students — deduped, tagged, filterable, height-capped */}
        <div ref={atRiskRef} className="col-span-12">
        <WidgetCard
          title={t('gradesModule.overview.atRisk.title')}
          subtitle={t('gradesModule.overview.atRisk.dedupeSubtitle', { raw: formatNumber(rawFlagCount) })}
          iconSignature="atrisk"
          span={12}
          footer={
            gradePerms.view && atRisk.length > 0 ? (
              <button
                type="button"
                onClick={() => exportAtRiskCsv(atRisk, schoolId)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
              >
                <Download className="h-3.5 w-3.5" />
                {t('gradesModule.overview.atRisk.export')}
              </button>
            ) : undefined
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <SegmentedControl
                aria-label={t('gradesModule.overview.atRisk.filterAria')}
                value={arFilter}
                onChange={(v) => setArFilter(v as 'all' | 'graded' | 'pending')}
                tabs={[
                  { id: 'all', label: t('gradesModule.overview.atRisk.filterAll'), count: atRisk.length },
                  { id: 'graded', label: t('gradesModule.overview.atRisk.filterGraded'), count: gradedAtRisk.length },
                  { id: 'pending', label: t('gradesModule.overview.atRisk.filterPending'), count: pendingAtRisk.length },
                ]}
              />
              {pendingAtRisk.length > 0 && (
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('gradesModule.overview.atRisk.pendingNote', { count: formatNumber(pendingAtRisk.length) })}
                </span>
              )}
            </div>
            <div className="max-h-96 space-y-1 overflow-auto">
              {visibleAtRisk.map((s) => {
                const pill =
                  s.tag === 'failing'
                    ? { variant: 'danger' as const, label: t('gradesModule.overview.atRisk.tagFailing') }
                    : s.tag === 'below-pass'
                      ? { variant: 'warning' as const, label: t('gradesModule.overview.atRisk.tagBelowPass') }
                      : { variant: 'neutral' as const, label: t('gradesModule.overview.atRisk.tagNotGraded') }
                return (
                  <div
                    key={s.studentId}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[rgb(var(--background-tertiary))]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--background-tertiary))] text-2xs font-semibold text-[rgb(var(--text-secondary))]">
                      {getInitials(s.studentName)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[rgb(var(--text-primary))]">{s.studentName}</span>
                    <span className="hidden min-w-0 flex-1 truncate text-xs text-[rgb(var(--text-tertiary))] sm:block">{s.courseName}</span>
                    <StatusPill variant={pill.variant} label={pill.label} />
                    <span className="w-20 text-right text-xs tabular-nums text-[rgb(var(--text-secondary))]">
                      {s.tag === 'not-graded' ? '—' : `${s.numericGrade.toFixed(0)}% ${s.letterGrade ?? ''}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </WidgetCard>
        </div>
      </WidgetGrid>
    </div>
  )
}
