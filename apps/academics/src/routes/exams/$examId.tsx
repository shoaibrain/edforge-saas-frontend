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
  CheckCircle2,
  ChevronRight,
  Loader2,
  ScrollText,
  Pencil,
} from 'lucide-react'
import { z } from 'zod'
import { usePermission } from '@edforge/abac'
import type { ExamStatus } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useGradingPeriods } from '../../hooks/useSchool'
import { useExam, useExamPattern, useTransitionExamStatus } from '../../hooks/useExams'
import { useAcademicsI18n } from '../../lib/i18n'
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
  { id: 'overview', label: 'examModule.detail.tabs.overview' },
  { id: 'subjects', label: 'examModule.detail.tabs.subjects' },
  { id: 'scores', label: 'examModule.detail.tabs.scores' },
]

// ============================================================================
// PRESENTATION HELPERS
// ============================================================================

function StatusPill({ status }: { status: ExamStatus }) {
  const { t } = useAcademicsI18n()
  const meta = getExamStatusMeta(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.className}`}>
      {t(`examModule.status.${status}`)}
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
  const { t } = useAcademicsI18n()
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
                  ? `${meta.className} ring-2 ring-[rgb(var(--state-info-border)/0.50)]`
                  : done
                    ? 'text-text-secondary'
                    : 'text-text-tertiary opacity-60'
              }`}
            >
              {done && <Check className="w-3 h-3" />}
              {t(`examModule.status.${s}`)}
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

/**
 * P1c — result-generation status on a closed exam (event-driven, no polling
 * infra). The result-batch Lambda flips the exam from `pending` → `generated`
 * (cards ready) or `failed` (DLQ'd); surfacing it here means a closed exam is
 * never a silent empty state. The detail query polls while `pending` so this
 * resolves without a manual refresh.
 */
function ResultGenerationBadge({
  status,
  generatedAt,
  error,
}: {
  status: 'pending' | 'generated' | 'failed'
  generatedAt?: string | null
  error?: string | null
}) {
  const { t, formatDateTime } = useAcademicsI18n()
  const meta = {
    pending: {
      label: t('examModule.resultGeneration.pending'),
      cls: 'text-[rgb(var(--state-warning-fg))]',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    generated: {
      label: t('examModule.resultGeneration.generated'),
      cls: 'text-[rgb(var(--state-success-fg))]',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    failed: {
      label: t('examModule.resultGeneration.failed'),
      cls: 'text-[rgb(var(--state-danger-fg))]',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  }[status]
  const title = error ?? (generatedAt ? t('examModule.resultGeneration.generatedAt', { dateTime: formatDateTime(generatedAt) }) : undefined)
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border-secondary/50">
      <span className="text-xs text-text-tertiary">
        {t('examModule.resultGeneration.label')}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.cls}`}
        title={title ?? undefined}
      >
        {meta.icon}
        {meta.label}
      </span>
    </div>
  )
}

function transitionToneClass(tone: ExamTransitionAction['tone']): string {
  const base = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50'
  if (tone === 'primary') return `${base} text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-fg))] hover:brightness-95`
  if (tone === 'warning') return `${base} text-[rgb(var(--action-primary-fg))] bg-amber-600 hover:bg-amber-700`
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

// ============================================================================
// EXAM DETAIL MODULE
// ============================================================================

export function ExamDetailModule() {
  const { t, formatDate } = useAcademicsI18n()
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
    const confirmMessage = t(`examModule.transitionConfirm.${action.to}`)
    if (action.confirm && !window.confirm(confirmMessage)) return
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
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            {t('examModule.detail.notFoundTitle')}
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            {t('examModule.detail.notFoundDescription')}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/exams' })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-fg))] rounded-lg hover:brightness-95 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('examModule.detail.backToExams')}
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
            {t('examModule.detail.backToExams')}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.20)] to-[rgb(var(--state-info-bg)/0.14)]">
                <ClipboardList className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-text-primary truncate">{exam.examName}</h1>
                  <StatusPill status={exam.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-text-secondary">
                  <span>{t(`examModule.types.${exam.examType}`, { defaultValue: humanizeExamType(exam.examType) })}</span>
                  <span className="text-text-tertiary">·</span>
                  <span>{termName ?? t('examModule.detail.noTerm')}</span>
                  <span className="text-text-tertiary">·</span>
                  <span className="whitespace-nowrap">
                    {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
                  </span>
                </div>
                {exam.gradeLevels && exam.gradeLevels.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-text-tertiary">
                      {t('examModule.detail.grades')}
                    </span>
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
                  {t('examModule.detail.edit')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setResultCardsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary border border-border-secondary rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <ScrollText className="w-4 h-4" />
                {t('examModule.detail.resultCards')}
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
            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              {t('examModule.detail.lifecycle')}
            </h4>
          </div>
          <StatusPipeline status={exam.status} />
          {exam.status === 'closed' && exam.resultGenerationStatus && (
            <ResultGenerationBadge
              status={exam.resultGenerationStatus}
              generatedAt={exam.resultsGeneratedAt}
              error={exam.lastGenerationError}
            />
          )}
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
                    {t(`examModule.transitions.${action.to}`)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary pt-1">
                {t('examModule.detail.lifecycleComplete')}
              </p>
            )
          ) : null}
        </div>

        {/* Tabs */}
        <div>
          <nav className="flex gap-1 border-b border-border-secondary mb-5" aria-label={t('examModule.detail.tabsAria')}>
            {EXAM_DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-text-primary border-[rgb(var(--state-info-border))]'
                    : 'text-text-tertiary border-transparent hover:text-text-secondary'
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border-secondary p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border-secondary">
                  <CalendarDays className="w-4 h-4 text-text-tertiary" />
                  <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    {t('examModule.detail.tabs.overview')}
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <DetailField label={t('examModule.detail.fields.type')} value={t(`examModule.types.${exam.examType}`, { defaultValue: humanizeExamType(exam.examType) })} />
                  <DetailField label={t('examModule.detail.fields.term')} value={termName} />
                  <DetailField label={t('examModule.detail.fields.status')} value={t(`examModule.status.${exam.status}`)} />
                  <DetailField
                    label={t('examModule.detail.fields.gradeLevels')}
                    value={exam.gradeLevels?.length ? <GradeChips gradeLevels={exam.gradeLevels} /> : undefined}
                  />
                  <DetailField label={t('examModule.detail.fields.startDate')} value={formatDate(exam.startDate)} />
                  <DetailField label={t('examModule.detail.fields.endDate')} value={formatDate(exam.endDate)} />
                  <DetailField label={t('examModule.detail.fields.created')} value={formatDate(exam.createdAt)} />
                </div>
              </div>

              {exam.description && (
                <div className="rounded-xl border border-border-secondary p-5">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-secondary">
                    <FileText className="w-4 h-4 text-text-tertiary" />
                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                      {t('examModule.detail.fields.description')}
                    </h4>
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
