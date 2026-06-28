/**
 * Exams Module
 *
 * School + academic-year scoped exam list. Exams are keyed at the
 * (school, academicYear, term) level — not per-section. Clicking an exam opens
 * its detail command center (/exams/$examId).
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Flag, Plus, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import type { RowSelectionState } from '@tanstack/react-table'
import { usePermission } from '@edforge/abac'
import { ContextBar, ContextBarSep, ContextBarYear, type BulkAction } from '@edforge/ui'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks/useSchool'
import { useExams, useExamPattern } from '../../hooks/useExams'
import { ExamTable } from '../../components/exams/ExamTable'
import { ExamDrawer } from '../../components/exams/ExamDrawer'
import { BulkExamStatusDrawer } from '../../components/exams/BulkExamStatusDrawer'
import {
  ExamSummary,
  filterExamsByBucket,
  labelForBucket,
  type ExamBucket,
} from '../../components/exams/ExamSummary'

interface TermOption {
  periodId: string
  name: string
}

export function ExamsModule() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const canCreateExam = usePermission('create', 'assessments')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeBucket, setActiveBucket] = useState<ExamBucket>('total')
  // Lifted so the BulkExamStatusDrawer can clear selection after a
  // successful apply (the table's selection lives in tableId-persisted
  // state otherwise; lifting it here is a no-op for the floating bulk
  // bar and only matters when the page wants to reset).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkStatusTarget, setBulkStatusTarget] = useState<ExamResponseDto[] | null>(null)

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

  // The summary strip and the table see the same dataset, but the table
  // narrows when a bucket is active so its faceted counts, Clear (N), and
  // Export all reflect the filtered view (matches the prototype's
  // "Filtered by Awaiting Results" screenshot where the table reads 3 of 3).
  const filteredExams = useMemo(
    () => filterExamsByBucket(exams, activeBucket),
    [exams, activeBucket],
  )

  const canOpenDrawer = canCreateExam && terms.length > 0 && examPattern.length > 0

  // Change status → BulkExamStatusDrawer (issue #238). Generate results
  // is still a toast — the result-batch backend doesn't expose a bulk
  // surface yet and is filed as a separate follow-up.
  const bulkActions: BulkAction<ExamResponseDto>[] = useMemo(
    () => [
      {
        id: 'change-status',
        label: 'Change status',
        icon: <Flag className="w-4 h-4" />,
        onRun: (rows) => setBulkStatusTarget(rows),
      },
      {
        id: 'generate-results',
        label: 'Generate results',
        icon: <RefreshCw className="w-4 h-4" />,
        onRun: (rows) => {
          const closable = rows.filter((r) => r.status === 'closed')
          if (closable.length === 0) {
            toast.error('Only closed exams can generate result cards.')
            return
          }
          toast.info(`Will queue result generation for ${closable.length} exam${closable.length === 1 ? '' : 's'} — coming soon`)
        },
      },
    ],
    []
  )

  const showFilterChip = activeBucket !== 'total'

  return (
    <div className="min-h-full p-6 space-y-5">
      <ContextBar
        meta={
          <>
            {currentYear?.name ? (
              <ContextBarYear>{currentYear.name}</ContextBarYear>
            ) : null}
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
        description={
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            {currentYear?.name
              ? `Plan, run, and publish exams for ${currentYear.name}`
              : 'Plan, run, and publish midterms, finals, and term examinations'}
          </p>
        }
        actions={
          canCreateExam ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              disabled={!canOpenDrawer}
              title={!canOpenDrawer ? 'An academic year with terms is required first' : undefined}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create Exam
            </button>
          ) : undefined
        }
      />

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
          <ExamSummary
            exams={exams}
            isLoading={isLoading}
            activeBucket={activeBucket}
            onBucketChange={setActiveBucket}
          />

          {showFilterChip && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                Filtered by{' '}
                <span className="text-[rgb(var(--text-primary))] font-medium">
                  {labelForBucket(activeBucket as Exclude<ExamBucket, null | 'total'>)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveBucket('total')}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
              >
                <X className="w-3 h-3" />
                Clear (1)
              </button>
            </div>
          )}

          <ExamTable
            exams={filteredExams}
            termNameById={termNameById}
            isLoading={isLoading}
            onSelectExam={(exam) => navigate({ to: '/exams/$examId', params: { examId: exam.examId } })}
            bulkActions={bulkActions}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </>
      )}

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

      <BulkExamStatusDrawer
        open={!!bulkStatusTarget}
        exams={bulkStatusTarget ?? []}
        onClose={() => setBulkStatusTarget(null)}
        onComplete={() => setRowSelection({})}
      />
    </div>
  )
}

export default ExamsModule
