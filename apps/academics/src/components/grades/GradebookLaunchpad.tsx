/**
 * GradebookLaunchpad — the default Gradebook landing when no section is open.
 *
 * Replaces the old blank "Select a Class Section" card with a contextful
 * launchpad: a summary strip, a resume card (last-viewed section), and one card
 * per section sorted needs-attention-first. Per-section stats (avg / GPA /
 * at-risk / % complete) are derived client-side from batched section gradebooks
 * (`useBulkSectionGrades`) — the aggregate overview endpoint only goes to course
 * granularity. Presentation only; entering a section just sets the store id.
 */

import { useMemo } from 'react'
import { ArrowRight, BarChart3, PlayCircle } from 'lucide-react'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { StatusPill, AnimatedProgressBar } from '@edforge/ui'
import { useBulkSectionGrades } from '../../hooks/useGrades'
import { getSubjectIcon } from '../../utils/subject-icon'
import { getColorForSubjectArea } from '../../lib/classroom-colors'
import { useAcademicsI18n } from '../../lib/i18n'

// Students scoring below this % count as "at risk" (matches the school-wide
// pass target used by the analytics view).
const PASS_THRESHOLD = 60

type SectionStatus = 'attention' | 'in-progress' | 'on-track' | 'not-started'

interface SectionRollup {
  sectionId: string
  isLoading: boolean
  gradedCount: number
  rosterCount: number
  avg: number | null
  gpa: number | null
  atRisk: number
  completionPct: number
  status: SectionStatus
}

// Sort priority + presentation per status (attention first). Bars/chips route
// through semantic state tokens; "on-track" uses success (the mint accent).
const STATUS_META: Record<
  SectionStatus,
  { order: number; bar: string; pill: 'danger' | 'warning' | 'success' | 'neutral'; labelKey: string }
> = {
  attention: { order: 0, bar: 'bg-[rgb(var(--state-danger-fg))]', pill: 'danger', labelKey: 'classrooms.gradebook.launchpad.status.attention' },
  'in-progress': { order: 1, bar: 'bg-[rgb(var(--state-warning-fg))]', pill: 'warning', labelKey: 'classrooms.gradebook.launchpad.status.inProgress' },
  'not-started': { order: 2, bar: 'bg-[rgb(var(--border-primary)/0.5)]', pill: 'neutral', labelKey: 'classrooms.gradebook.launchpad.status.notStarted' },
  'on-track': { order: 3, bar: 'bg-[rgb(var(--state-success-fg))]', pill: 'success', labelKey: 'classrooms.gradebook.launchpad.status.onTrack' },
}

interface GradebookLaunchpadProps {
  sections: SectionResponseDto[]
  schoolId: string
  termId?: string
  lastSectionId: string | null
  onEnterSection: (sectionId: string) => void
  onOpenAnalytics: () => void
}

export function GradebookLaunchpad({
  sections,
  schoolId,
  termId,
  lastSectionId,
  onEnterSection,
  onOpenAnalytics,
}: GradebookLaunchpadProps) {
  const { t, formatNumber } = useAcademicsI18n()

  const sectionIds = useMemo(() => sections.map((s) => s.sectionId), [sections])
  const gradeQueries = useBulkSectionGrades(sectionIds, { schoolId, termId }, sectionIds.length > 0)

  // Derive a per-section rollup from each section's gradebook + its roster size.
  const rollups = useMemo<Record<string, SectionRollup>>(() => {
    const map: Record<string, SectionRollup> = {}
    sections.forEach((s, i) => {
      const q = gradeQueries[i]
      const grades = q?.data?.grades ?? []
      const gradedCount = grades.length
      const rosterCount = s.currentEnrollment || 0
      const avg = gradedCount > 0 ? grades.reduce((sum, g) => sum + g.numericGrade, 0) / gradedCount : null
      const gpa = gradedCount > 0 ? grades.reduce((sum, g) => sum + g.gpaPoints, 0) / gradedCount : null
      const atRisk = grades.filter((g) => g.numericGrade < PASS_THRESHOLD).length
      const completionPct = rosterCount > 0 ? Math.round((gradedCount / rosterCount) * 100) : 0
      let status: SectionStatus
      if (gradedCount === 0) status = 'not-started'
      else if (atRisk > 0) status = 'attention'
      else if (completionPct >= 100) status = 'on-track'
      else status = 'in-progress'
      map[s.sectionId] = {
        sectionId: s.sectionId,
        isLoading: q?.isLoading ?? false,
        gradedCount,
        rosterCount,
        avg,
        gpa,
        atRisk,
        completionPct,
        status,
      }
    })
    return map
  }, [sections, gradeQueries])

  const sortedSections = useMemo(
    () =>
      [...sections].sort((a, b) => {
        const ra = rollups[a.sectionId]
        const rb = rollups[b.sectionId]
        const oa = ra ? STATUS_META[ra.status].order : 9
        const ob = rb ? STATUS_META[rb.status].order : 9
        if (oa !== ob) return oa - ob
        return (a.courseName || a.sectionNumber || '').localeCompare(b.courseName || b.sectionNumber || '')
      }),
    [sections, rollups],
  )

  // Summary counts.
  const summary = useMemo(() => {
    const all = Object.values(rollups)
    return {
      total: sections.length,
      withGrades: all.filter((r) => r.gradedCount > 0).length,
      needAttention: all.filter((r) => r.status === 'attention').length,
      notStarted: all.filter((r) => r.status === 'not-started').length,
    }
  }, [rollups, sections.length])

  const resumeSection = lastSectionId ? sections.find((s) => s.sectionId === lastSectionId) : undefined
  const resumeRollup = resumeSection ? rollups[resumeSection.sectionId] : undefined

  const sectionLabel = (s: SectionResponseDto) =>
    s.courseName || s.courseCode || t('classrooms.gradebook.sectionFallback')

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
            {t('classrooms.tabs.gradebook')}
          </h3>
          <p className="mt-0.5 text-sm text-[rgb(var(--text-tertiary))]">
            {t('classrooms.gradebook.launchpad.helper')}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAnalytics}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] px-3 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
        >
          <BarChart3 className="h-4 w-4" />
          {t('classrooms.actions.gradeAnalytics')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[rgb(var(--text-tertiary))]">
        <span>
          <b className="font-semibold tabular-nums text-[rgb(var(--text-primary))]">{formatNumber(summary.total)}</b>{' '}
          {t('classrooms.gradebook.launchpad.summary.sections')}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <b className="font-semibold tabular-nums text-[rgb(var(--state-success-fg))]">{formatNumber(summary.withGrades)}</b>{' '}
          {t('classrooms.gradebook.launchpad.summary.withGrades')}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <b
            className={`font-semibold tabular-nums ${summary.needAttention > 0 ? 'text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--text-primary))]'}`}
          >
            {formatNumber(summary.needAttention)}
          </b>{' '}
          {t('classrooms.gradebook.launchpad.summary.needAttention')}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <b className="font-semibold tabular-nums text-[rgb(var(--text-tertiary))]">{formatNumber(summary.notStarted)}</b>{' '}
          {t('classrooms.gradebook.launchpad.summary.notStarted')}
        </span>
      </div>

      {/* Resume card */}
      {resumeSection && (
        <button
          type="button"
          onClick={() => onEnterSection(resumeSection.sectionId)}
          className="flex w-full items-center gap-4 rounded-xl border border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg)/0.4)] px-4 py-3 text-start transition-colors hover:bg-[rgb(var(--state-success-bg)/0.6)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]">
            <PlayCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--state-success-fg))]">
              {t('classrooms.gradebook.launchpad.resume.title')}
            </div>
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {sectionLabel(resumeSection)} · {resumeSection.sectionNumber}
            </div>
            {resumeRollup && resumeRollup.gradedCount > 0 && (
              <div className="mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
                {t('classrooms.gradebook.launchpad.card.gradedAvg', {
                  pct: formatNumber(resumeRollup.completionPct),
                  avg: formatNumber(Math.round(resumeRollup.avg ?? 0)),
                })}
              </div>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[rgb(var(--state-success-fg))]">
            {t('classrooms.gradebook.launchpad.resume.action')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      )}

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSections.map((s) => {
          const r = rollups[s.sectionId]
          const status = r?.status ?? 'not-started'
          const meta = STATUS_META[status]
          const color = getColorForSubjectArea(s.subjectArea)
          const SubjectIcon = getSubjectIcon(s.subjectArea)
          const notStarted = !r || r.gradedCount === 0
          return (
            <button
              key={s.sectionId}
              type="button"
              onClick={() => onEnterSection(s.sectionId)}
              className="group flex flex-col overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] text-start transition-colors hover:border-[rgb(var(--border-primary)/0.6)]"
            >
              {/* 3px-ish status accent bar */}
              <span className={`h-1 w-full ${meta.bar}`} aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Title row */}
                <div className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color.bg} ${color.text}`}>
                    <SubjectIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                      {sectionLabel(s)}
                    </div>
                    <div className="truncate text-xs text-[rgb(var(--text-tertiary))]">{s.sectionNumber}</div>
                  </div>
                  <StatusPill variant={meta.pill} label={t(meta.labelKey)} />
                </div>

                {/* Stats / not-started affordance */}
                {notStarted ? (
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                    {t('classrooms.gradebook.launchpad.card.noGradesYet')}
                    <span className="inline-flex items-center gap-0.5 font-medium text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))]">
                      {t('classrooms.gradebook.launchpad.card.startGrading')}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <Stat label={t('classrooms.gradebook.launchpad.card.classAvg')} value={`${formatNumber(Math.round(r.avg ?? 0))}%`} />
                      <Stat label={t('classrooms.gradebook.launchpad.card.avgGpa')} value={formatNumber(Number((r.gpa ?? 0).toFixed(2)))} />
                      <Stat
                        label={t('classrooms.gradebook.launchpad.card.atRisk')}
                        value={formatNumber(r.atRisk)}
                        tone={r.atRisk > 0 ? 'danger' : 'default'}
                      />
                    </div>
                    <div className="space-y-1">
                      <AnimatedProgressBar
                        percentage={r.completionPct}
                        color={meta.bar.includes('danger') ? 'rgb(var(--state-danger-fg))' : meta.bar.includes('warning') ? 'rgb(var(--state-warning-fg))' : 'rgb(var(--state-success-fg))'}
                        label={t('classrooms.gradebook.launchpad.card.progressAria', { pct: r.completionPct })}
                        height={4}
                      />
                      <div className="text-xs text-[rgb(var(--text-tertiary))]">
                        {t('classrooms.gradebook.launchpad.card.gradedProgress', {
                          graded: formatNumber(r.gradedCount),
                          total: formatNumber(r.rosterCount),
                          pct: formatNumber(r.completionPct),
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center gap-2 border-t border-[rgb(var(--border-primary)/0.2)] pt-2.5 text-xs text-[rgb(var(--text-tertiary))]">
                  {s.primaryTeacherName ? <span className="truncate">{s.primaryTeacherName}</span> : null}
                  {s.primaryTeacherName ? <span aria-hidden="true">·</span> : null}
                  <span className="whitespace-nowrap">
                    {t('classrooms.gradebook.launchpad.card.students', { count: formatNumber(s.currentEnrollment || 0) })}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' }) {
  return (
    <div className="min-w-0">
      <div
        className={`truncate text-sm font-semibold tabular-nums ${tone === 'danger' ? 'text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--text-primary))]'}`}
      >
        {value}
      </div>
      <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">{label}</div>
    </div>
  )
}
