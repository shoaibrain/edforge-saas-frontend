/**
 * Exams Module
 *
 * School + academic-year scoped exam list. Exams are keyed at the
 * (school, academicYear, term) level — not per-section. Clicking an exam opens
 * its detail command center (/exams/$examId).
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Flag, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@edforge/abac'
import type { BulkAction } from '@edforge/ui'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks/useSchool'
import { useExams, useExamPattern } from '../../hooks/useExams'
import { ExamTable } from '../../components/exams/ExamTable'
import { ExamDrawer } from '../../components/exams/ExamDrawer'

interface TermOption {
  periodId: string
  name: string
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

  // Bulk actions wired to no-op toasts until the bulk status/results flows
  // ship. The shared <DataTable /> still surfaces the floating bulk bar and
  // built-in CSV export from these declarations.
  const bulkActions: BulkAction<ExamResponseDto>[] = useMemo(
    () => [
      {
        id: 'change-status',
        label: 'Change status',
        icon: <Flag className="w-4 h-4" />,
        onRun: (rows) => {
          toast.info(`Bulk change status for ${rows.length} exam${rows.length === 1 ? '' : 's'} — coming soon`)
        },
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

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.20)] to-[rgb(var(--state-info-bg)/0.14)]">
              <ClipboardList className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Examinations</h1>
              <p className="text-text-secondary mt-1">
                {currentYear?.name
                  ? `Exams for ${currentYear.name}`
                  : 'Midterms, finals, and term examinations'}
              </p>
            </div>
          </div>
          {canCreateExam && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              disabled={!canOpenDrawer}
              title={!canOpenDrawer ? 'An academic year with terms is required first' : undefined}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-fg))] rounded-lg hover:brightness-95 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create Exam
            </button>
          )}
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
          <ExamTable
            exams={exams}
            termNameById={termNameById}
            isLoading={isLoading}
            onSelectExam={(exam) => navigate({ to: '/exams/$examId', params: { examId: exam.examId } })}
            bulkActions={bulkActions}
          />
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
