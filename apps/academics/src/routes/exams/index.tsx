/**
 * Exams Module
 *
 * School + academic-year scoped exam list. Exams are keyed at the
 * (school, academicYear, term) level — not per-section. Clicking an exam opens
 * its detail command center (/exams/$examId).
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ClipboardList, Flag, Plus, RefreshCw, X, AlertTriangle, CalendarDays, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { RowSelectionState } from '@tanstack/react-table'
import { usePermission } from '@edforge/abac'
import {
  PageHeader,
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  SelectionContextBar,
  type Signal,
  type SelectionAction,
} from '@edforge/ui'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks/useSchool'
import { useExams, useExamPattern } from '../../hooks/useExams'
import { useSignalAcks } from '../../hooks/useSignalAcks'
import { useAcademicsI18n } from '../../lib/i18n'
import { ExamTable } from '../../components/exams/ExamTable'
import { ExamDrawer } from '../../components/exams/ExamDrawer'
import { BulkExamStatusDrawer } from '../../components/exams/BulkExamStatusDrawer'
import {
  ExamSummary,
  filterExamsByBucket,
  type ExamBucket,
} from '../../components/exams/ExamSummary'

interface TermOption {
  periodId: string
  name: string
}

export function ExamsModule() {
  const { t, formatNumber } = useAcademicsI18n()
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const canCreateExam = usePermission('create', 'assessments')
  const canEditExam = usePermission('edit', 'assessments')
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
  const exams = useMemo(() => examList?.items ?? [], [examList])

  // The summary strip and the table see the same dataset, but the table
  // narrows when a bucket is active so its faceted counts, Clear (N), and
  // Export all reflect the filtered view (matches the prototype's
  // "Filtered by Awaiting Results" screenshot where the table reads 3 of 3).
  const filteredExams = useMemo(
    () => filterExamsByBucket(exams, activeBucket),
    [exams, activeBucket],
  )

  const canOpenDrawer = canCreateExam && terms.length > 0 && examPattern.length > 0

  // ── ⑧ Attention Corner signals — page-scoped, from the exam list already
  // fetched (they auto-resolve as statuses/results move on). Fixes deep-link
  // into this page's own lifecycle buckets.
  const { acked, ack, unack } = useSignalAcks()
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const signals: Signal[] = useMemo(() => {
    const list: Signal[] = []
    const endingToday = exams.filter(
      (e) => e.status === 'in_progress' && !!e.endDate && e.endDate <= todayStr,
    ).length
    const awaiting = exams.filter(
      (e) => e.status === 'closed' && e.resultGenerationStatus !== 'generated',
    ).length
    const startingSoon = exams.filter((e) => {
      if (e.status !== 'scheduled' || !e.startDate) return false
      const inSevenDays = new Date(Date.parse(todayStr) + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      return e.startDate >= todayStr && e.startDate <= inSevenDays
    }).length
    if (endingToday > 0) {
      list.push({
        id: 'exams.live-ending-today',
        severity: 'critical',
        domain: t('moduleOverview.signals.domains.assessment'),
        icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
        title: t('examModule.signals.endingTodayTitle', { count: formatNumber(endingToday) }),
        description: t('examModule.signals.endingTodaySub'),
        fix: { label: t('examModule.signals.viewLive'), onAction: () => setActiveBucket('live') },
      })
    }
    if (awaiting > 0) {
      list.push({
        id: 'exams.awaiting-results',
        severity: 'warn',
        domain: t('moduleOverview.signals.domains.assessment'),
        icon: <Clock className="h-4 w-4" aria-hidden="true" />,
        title: t('examModule.signals.awaitingTitle', { count: formatNumber(awaiting) }),
        description: t('examModule.signals.awaitingSub'),
        fix: { label: t('examModule.signals.viewAwaiting'), onAction: () => setActiveBucket('awaiting') },
      })
    }
    if (startingSoon > 0) {
      list.push({
        id: 'exams.starting-soon',
        severity: 'info',
        domain: t('moduleOverview.signals.domains.assessment'),
        icon: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
        title: t('examModule.signals.startingSoonTitle', { count: formatNumber(startingSoon) }),
        description: t('examModule.signals.startingSoonSub'),
        fix: { label: t('examModule.signals.viewUpcoming'), onAction: () => setActiveBucket('upcoming') },
      })
    }
    return list
  }, [exams, todayStr, t, formatNumber])

  // ── ⑨ Selection Context Bar — state-aware matrix (retires the floating
  // pill). Change status opens the real BulkExamStatusDrawer (it computes
  // per-row eligible transitions); Generate results applies only to Closed
  // exams without results (subset chip) and stays a coming-soon toast — the
  // result-batch backend has no bulk surface yet (follow-up on file).
  const selectedExams = useMemo(() => {
    const ids = new Set(Object.keys(rowSelection))
    return filteredExams.filter((e) => ids.has(e.examId))
  }, [rowSelection, filteredExams])

  const selectionActions = useMemo<SelectionAction[]>(() => {
    const byId = new Map(selectedExams.map((e) => [e.examId, e]))
    const rowsFor = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((e): e is ExamResponseDto => !!e)
    const genableIds = selectedExams
      .filter((e) => e.status === 'closed' && e.resultGenerationStatus !== 'generated')
      .map((e) => e.examId)
    return [
      {
        id: 'change-status',
        label: t('examModule.bulk.changeStatus'),
        icon: <Flag className="h-3.5 w-3.5" />,
        applicableIds: selectedExams.map((e) => e.examId),
        locked: !canEditExam,
        lockedReason: t('studentsModule.bulk.requiresAdmin'),
        onAction: (ids) => setBulkStatusTarget(rowsFor(ids)),
      },
      {
        id: 'generate-results',
        label: t('examModule.bulk.generateResults'),
        icon: <RefreshCw className="h-3.5 w-3.5" />,
        applicableIds: genableIds,
        disabledReason: t('examModule.bulk.onlyClosed'),
        onAction: (ids) =>
          toast.info(t('examModule.bulk.generateComingSoon', { count: ids.length })),
      },
    ]
  }, [selectedExams, canEditExam, t])

  const singleExam = selectedExams.length === 1 ? selectedExams[0] : null
  const selectionBar = (
    <SelectionContextBar
      selectedCount={selectedExams.length}
      totalCount={filteredExams.length}
      onClear={() => setRowSelection({})}
      onSelectAll={() =>
        setRowSelection(Object.fromEntries(filteredExams.map((e) => [e.examId, true])))
      }
      actions={selectionActions}
      aria-label={t('dataTable.selection.aria')}
      labels={{
        selected: (count) => t('dataTable.selection.selected', { count: formatNumber(count) }),
        selectAll: (total) => t('dataTable.selection.selectAll', { count: formatNumber(total) }),
        clear: t('dataTable.selection.clear'),
      }}
      peek={
        singleExam ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {singleExam.examName}
            </div>
            <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">
              {termNameById[singleExam.termId ?? ''] ?? ''}
              {' · '}
              {t(`examModule.status.${singleExam.status}`)}
            </div>
          </div>
        ) : undefined
      }
    />
  )

  const showFilterChip = activeBucket !== 'total'

  return (
    <div className="min-h-full p-6 space-y-5">
      {/* ⑧ Header zone — attention pill left, actions right; shade in flow */}
      <AttentionCorner
        signals={isLoading ? [] : signals}
        acked={acked}
        onAck={ack}
        onUnack={unack}
        labels={{
          needAttention: t('moduleOverview.signals.needAttention'),
          allClear: t('moduleOverview.signals.allClear'),
          region: t('moduleOverview.needsAttention.title'),
          minimize: t('moduleOverview.signals.minimize'),
          acknowledge: t('moduleOverview.signals.acknowledge'),
          acknowledged: t('moduleOverview.signals.acknowledged'),
          acknowledgedHint: t('moduleOverview.signals.acknowledgedHint'),
          dismiss: t('moduleOverview.signals.dismiss'),
          emptyTitle: t('moduleOverview.signals.emptyTitle'),
        }}
      >
        {/* One space-y child: the shade's gap lives inside its animated height */}
        <div>
          <PageHeader
            mode="pagebar"
            attention={<AttentionCornerPill />}
            actions={
              canCreateExam
                ? [
                    {
                      label: t('examModule.createExam'),
                      icon: <Plus className="h-3.5 w-3.5" />,
                      primary: true,
                      disabled: !canOpenDrawer,
                      ariaLabel: !canOpenDrawer ? t('examModule.createDisabledTitle') : t('examModule.createExam'),
                      onClick: () => setDrawerOpen(true),
                    },
                  ]
                : undefined
            }
          />
          <AttentionCornerShade className="pt-5" />
        </div>
      </AttentionCorner>

      {!academicYearId ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            {t('examModule.noActiveYear.title')}
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            {t('examModule.noActiveYear.description')}
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
                {t('examModule.filter.filteredBy')}{' '}
                <span className="text-[rgb(var(--text-primary))] font-medium">
                  {t(`examModule.summary.${activeBucket}`)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveBucket('total')}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
              >
                <X className="w-3 h-3" />
                {t('examModule.filter.clear')}
              </button>
            </div>
          )}

          <ExamTable
            exams={filteredExams}
            termNameById={termNameById}
            isLoading={isLoading}
            onSelectExam={(exam) => navigate({ to: '/exams/$examId', params: { examId: exam.examId } })}
            selectionBar={selectionBar}
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
