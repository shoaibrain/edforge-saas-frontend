/**
 * Exam Detail — the exam command center (Slice 2).
 *
 * Route `/academics/exams/$examId`. Drives the exam lifecycle the list page
 * can only display: status pipeline + guard-aware transition actions
 * (Schedule / Start / Close / Publish), plus access to the exam's result cards.
 *
 * Subjects (exam-courses) and Scores tabs land in later slices (EM-2.4 / EM-3.1);
 * this surface is built to grow into the tabbed shell described in the Exam
 * Management FE sprint plan.
 */

import { useMemo, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ClipboardList,
  AlertCircle,
  CalendarDays,
  FileText,
  Clock,
  Check,
  ChevronRight,
  ScrollText,
  Pencil,
} from 'lucide-react'
import { z } from 'zod'
import { usePermission } from '@edforge/abac'
import type { ExamStatus } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useGradingPeriods } from '../../hooks/useSchool'
import { useExam, useExamPattern, useTransitionExamStatus } from '../../hooks/useExams'
import { getExamStatusMeta, humanizeExamType } from '../../schemas/exam.form'
import {
  EXAM_STATUS_PIPELINE,
  getExamTransitionActions,
  type ExamTransitionAction,
} from '../../schemas/exam-state-machine'
import { ResultCardsDrawer } from '../../components/exams/ResultCardsDrawer'
import { ExamDrawer } from '../../components/exams/ExamDrawer'
import { ExamSubjectsTab } from '../../components/exams/ExamSubjectsTab'
import { ExamScoresTab } from '../../components/exams/ExamScoresTab'

type ExamDetailTab = 'overview' | 'subjects' | 'scores'

const EXAM_DETAIL_TABS: { id: ExamDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'scores', label: 'Scores' },
]

// ============================================================================
// PRESENTATION HELPERS
// ============================================================================

function StatusPill({ status }: { status: ExamStatus }) {
  const meta = getExamStatusMeta(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

/**
 * ELS.7 — grade-level scope chips. The exam's `gradeLevels` drives the Subjects
 * picker, score roster, and Result Card generation, so surfacing it in the
 * header makes the scope legible at the moment the operator is making scoping
 * decisions. Legacy exams (pre-ELS.1, no gradeLevels) render nothing — the
 * Overview "Grade Levels" field shows the em-dash fallback instead.
 */
function GradeChips({ gradeLevels }: { gradeLevels?: string[] }) {
  if (!gradeLevels || gradeLevels.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {gradeLevels.map((g) => (
        <span
          key={g}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-secondary text-text-secondary border border-border-secondary"
        >
          {g}
        </span>
      ))}
    </div>
  )
}

function StatusPipeline({ status }: { status: ExamStatus }) {
  const currentIndex = EXAM_STATUS_PIPELINE.indexOf(status)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {EXAM_STATUS_PIPELINE.map((s, i) => {
        const done = i < currentIndex
        const current = i === currentIndex
        const meta = getExamStatusMeta(s)
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                current
                  ? `${meta.className} ring-2 ring-purple-400/50`
                  : done
                    ? 'text-text-secondary'
                    : 'text-text-tertiary opacity-60'
              }`}
            >
              {done && <Check className="w-3 h-3" />}
              {meta.label}
            </span>
            {i < EXAM_STATUS_PIPELINE.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function transitionToneClass(tone: ExamTransitionAction['tone']): string {
  const base = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50'
  if (tone === 'primary') return `${base} text-white bg-purple-600 hover:bg-purple-700`
  if (tone === 'warning') return `${base} text-white bg-amber-600 hover:bg-amber-700`
  return `${base} text-text-secondary border border-border-secondary hover:bg-surface-secondary`
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-tertiary mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary">{value || <span className="text-text-tertiary">—</span>}</dd>
    </div>
  )
}

function fmtDate(value?: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ============================================================================
// EXAM DETAIL MODULE
// ============================================================================

export function ExamDetailModule() {
  const { examId } = useParams({ from: '/exams/$examId' })
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''
  const canManage = usePermission('edit', 'assessments')
  const [resultCardsOpen, setResultCardsOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ExamDetailTab>('overview')

  const isValidId = useMemo(() => {
    try {
      z.string().uuid().parse(examId)
      return true
    } catch {
      return false
    }
  }, [examId])

  const { data: exam, isLoading, error } = useExam(examId, schoolId, isValidId && !!schoolId)
  const transition = useTransitionExamStatus()

  const { data: gradingPeriods } = useGradingPeriods(
    schoolId,
    exam?.academicYearId ?? '',
    !!schoolId && !!exam?.academicYearId,
  )
  const termOptions = useMemo(() => {
    const periods = (gradingPeriods ?? []) as Array<{ periodId?: string; termId?: string; name: string }>
    return periods.map((p) => ({ periodId: p.periodId ?? p.termId ?? '', name: p.name }))
  }, [gradingPeriods])
  const termName = useMemo(
    () => termOptions.find((p) => p.periodId === exam?.termId)?.name,
    [termOptions, exam?.termId],
  )

  const { data: examPatternData } = useExamPattern(!!schoolId)
  const examPattern = examPatternData?.examPattern ?? []

  const handleTransition = (action: ExamTransitionAction) => {
    if (!exam) return
    if (action.confirm && !window.confirm(action.confirm)) return
    transition.mutate({ examId: exam.examId, schoolId, targetStatus: action.to })
  }

  if (isLoading) {
    return (
      <div className="min-h-full p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-surface-secondary" />
            <div className="space-y-2">
              <div className="h-6 w-64 rounded bg-surface-secondary" />
              <div className="h-4 w-40 rounded bg-surface-secondary" />
            </div>
          </div>
          <div className="h-10 w-full max-w-xl rounded bg-surface-secondary" />
          <div className="h-40 rounded-xl bg-surface-secondary" />
        </div>
      </div>
    )
  }

  if (!isValidId || error || !exam) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Exam Not Found</h2>
          <p className="text-sm text-text-secondary mb-4">
            This exam may have been removed or you don&apos;t have access.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/exams' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  const actions = getExamTransitionActions(exam.status)

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <button
            type="button"
            onClick={() => navigate({ to: '/exams' })}
            className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-text-primary truncate">{exam.examName}</h1>
                  <StatusPill status={exam.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-text-secondary">
                  <span>{humanizeExamType(exam.examType)}</span>
                  <span className="text-text-tertiary">·</span>
                  <span>{termName ?? 'No term'}</span>
                  <span className="text-text-tertiary">·</span>
                  <span className="whitespace-nowrap">
                    {exam.startDate} → {exam.endDate}
                  </span>
                </div>
                {exam.gradeLevels && exam.gradeLevels.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-text-tertiary">Grades</span>
                    <GradeChips gradeLevels={exam.gradeLevels} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {canManage && exam.status !== 'published' && (
                <button
                  type="button"
                  onClick={() => setEditDrawerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary border border-border-secondary rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => setResultCardsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary border border-border-secondary rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <ScrollText className="w-4 h-4" />
                Result Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Lifecycle */}
        <div className="rounded-xl border border-border-secondary p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border-secondary">
            <Clock className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Lifecycle</h4>
          </div>
          <StatusPipeline status={exam.status} />
          {canManage ? (
            actions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {actions.map((action) => (
                  <button
                    key={action.to}
                    type="button"
                    onClick={() => handleTransition(action)}
                    disabled={transition.isPending}
                    className={transitionToneClass(action.tone)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary pt-1">
                This exam is published — its lifecycle is complete.
              </p>
            )
          ) : null}
        </div>

        {/* Tabs */}
        <div>
          <nav className="flex gap-1 border-b border-border-secondary mb-5" aria-label="Exam tabs">
            {EXAM_DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-text-primary border-purple-500'
                    : 'text-text-tertiary border-transparent hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border-secondary p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border-secondary">
                  <CalendarDays className="w-4 h-4 text-text-tertiary" />
                  <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Overview</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <DetailField label="Type" value={humanizeExamType(exam.examType)} />
                  <DetailField label="Term" value={termName} />
                  <DetailField label="Status" value={getExamStatusMeta(exam.status).label} />
                  <DetailField
                    label="Grade Levels"
                    value={exam.gradeLevels?.length ? <GradeChips gradeLevels={exam.gradeLevels} /> : undefined}
                  />
                  <DetailField label="Start Date" value={exam.startDate} />
                  <DetailField label="End Date" value={exam.endDate} />
                  <DetailField label="Created" value={fmtDate(exam.createdAt)} />
                </div>
              </div>

              {exam.description && (
                <div className="rounded-xl border border-border-secondary p-5">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-secondary">
                    <FileText className="w-4 h-4 text-text-tertiary" />
                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Description</h4>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{exam.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subjects' && (
            <ExamSubjectsTab
              examId={exam.examId}
              schoolId={schoolId}
              status={exam.status}
              canManage={canManage}
              examGradeLevels={exam.gradeLevels ?? []}
            />
          )}

          {activeTab === 'scores' && (
            <ExamScoresTab exam={exam} canManage={canManage} />
          )}
        </div>
      </div>

      <ResultCardsDrawer
        open={resultCardsOpen}
        onClose={() => setResultCardsOpen(false)}
        exam={resultCardsOpen ? exam : null}
      />

      <ExamDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        schoolId={schoolId}
        academicYearId={exam.academicYearId}
        terms={termOptions}
        examPattern={examPattern}
        exam={exam}
      />
    </div>
  )
}

export default ExamDetailModule
