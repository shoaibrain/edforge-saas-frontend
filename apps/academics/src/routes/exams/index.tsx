/**
 * Exams Module
 *
 * School + academic-year scoped exam list. Exams are keyed at the
 * (school, academicYear, term) level — not per-section. Clicking an exam opens
 * its detail command center (/exams/$examId).
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Plus } from 'lucide-react'
import { usePermission } from '@edforge/abac'
import { ContextBar, ContextBarSep, ContextBarYear } from '@edforge/ui'
import type { ExamStatus } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks/useSchool'
import { useExams, useExamPattern } from '../../hooks/useExams'
import { EXAM_STATUS_PIPELINE } from '../../schemas/exam-state-machine'
import { getExamStatusMeta } from '../../schemas/exam.form'
import { ExamTable } from '../../components/exams/ExamTable'
import { ExamDrawer } from '../../components/exams/ExamDrawer'

interface TermOption {
  periodId: string
  name: string
}

function StatusFilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? 'bg-[rgb(var(--state-info-fg)/0.12)] text-[rgb(var(--state-info-fg))] border-transparent'
          : 'bg-surface-primary text-text-secondary border-border-secondary hover:text-text-primary'
      }`}
    >
      {label}
      <span
        className={`text-xs font-semibold tabular-nums ${
          active ? 'text-[rgb(var(--state-info-fg))]' : 'text-text-tertiary'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

export function ExamsModule() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const canCreateExam = usePermission('create', 'assessments')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: currentYear } = useCurrentAcademicYear(schoolId, !!schoolId)
  const academicYearId = currentYear?.yearId ?? ''

  const { data: gradingPeriods } = useGradingPeriods(schoolId, academicYearId, !!schoolId && !!academicYearId)
  const terms: TermOption[] = useMemo(
    () =>
      ((gradingPeriods ?? []) as Array<{ periodId?: string; termId?: string; name: string }>).map((gp) => ({
        periodId: gp.periodId ?? gp.termId ?? '',
        name: gp.name,
      })),
    [gradingPeriods]
  )
  const termNameById = useMemo(
    () => Object.fromEntries(terms.map((t) => [t.periodId, t.name])),
    [terms]
  )

  const { data: examPatternData } = useExamPattern(!!schoolId)
  const examPattern = examPatternData?.examPattern ?? []

  const { data: examList, isLoading } = useExams(
    { schoolId, academicYearId },
    !!schoolId && !!academicYearId
  )
  const exams = examList?.items ?? []

  const canOpenDrawer = canCreateExam && terms.length > 0 && examPattern.length > 0

  // Status-aware list: order by lifecycle stage and let the operator filter by
  // stage. Counts + ordering come straight from each exam's `status`.
  const [statusFilter, setStatusFilter] = useState<ExamStatus | 'all'>('all')
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ExamStatus, number>> = {}
    for (const e of exams) counts[e.status] = (counts[e.status] ?? 0) + 1
    return counts
  }, [exams])
  const sortedExams = useMemo(
    () =>
      [...exams].sort(
        (a, b) =>
          EXAM_STATUS_PIPELINE.indexOf(a.status) - EXAM_STATUS_PIPELINE.indexOf(b.status)
      ),
    [exams]
  )
  const visibleExams = useMemo(
    () => (statusFilter === 'all' ? sortedExams : sortedExams.filter((e) => e.status === statusFilter)),
    [sortedExams, statusFilter]
  )
  const presentStatuses = useMemo(
    () => EXAM_STATUS_PIPELINE.filter((s) => statusCounts[s]),
    [statusCounts]
  )
  const showStatusFilter = presentStatuses.length > 1

  return (
    <div className="min-h-full">
      {/* Header — operating context, not a page title (breadcrumb already says Exams) */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-5">
          <ContextBar
            divider={false}
            meta={
              <>
                {currentYear?.name ? <ContextBarYear>{currentYear.name}</ContextBarYear> : null}
                {currentYear?.name ? <ContextBarSep /> : null}
                <span>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            }
            actions={
              canCreateExam ? (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  disabled={!canOpenDrawer}
                  title={!canOpenDrawer ? 'An academic year with terms is required first' : undefined}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-fg))] rounded-lg hover:brightness-95 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Create Exam
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      <div className="p-6">
        {!academicYearId ? (
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <h4 className="text-lg font-medium text-text-primary mb-2">No Active Academic Year</h4>
            <p className="text-text-secondary max-w-md mx-auto">
              Set a current academic year for this school to begin scheduling exams.
            </p>
          </div>
        ) : (
          <>
            {showStatusFilter && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <StatusFilterChip
                  label="All"
                  count={exams.length}
                  active={statusFilter === 'all'}
                  onClick={() => setStatusFilter('all')}
                />
                {presentStatuses.map((s) => (
                  <StatusFilterChip
                    key={s}
                    label={getExamStatusMeta(s).label}
                    count={statusCounts[s] ?? 0}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                  />
                ))}
              </div>
            )}
            <ExamTable
              exams={visibleExams}
              termNameById={termNameById}
              isLoading={isLoading}
              onSelectExam={(exam) => navigate({ to: '/exams/$examId', params: { examId: exam.examId } })}
            />
          </>
        )}
      </div>

      {canOpenDrawer && (
        <ExamDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          schoolId={schoolId}
          academicYearId={academicYearId}
          terms={terms}
          examPattern={examPattern}
        />
      )}

    </div>
  )
}

export default ExamsModule
