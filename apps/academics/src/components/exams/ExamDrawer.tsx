/**
 * ExamDrawer — exam create/edit slide-over.
 *
 * Pass `exam` to switch the drawer into edit mode (Slice 2 / EM-2.2).
 * Immutable in edit mode: schoolId, academicYearId, termId. `examType` is
 * only editable while exam.status === 'draft' (backend service guards it
 * otherwise; the UI mirrors that to avoid 409 surprises).
 */

import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, ClipboardList } from 'lucide-react'
import {
  FormProvider,
  useForm,
  useFormContext,
  Controller,
  zodResolver,
  TextField,
  SelectField,
  DateField,
  TextareaField,
  FormSection,
} from '@edforge/forms'
import type { CreateExamDto, ExamResponseDto, UpdateExamDto } from '@aibrains/shared-types'
import { useCreateExam, useUpdateExam } from '../../hooks/useExams'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { useAcademicsI18n } from '../../lib/i18n'
import { examFormSchema, type ExamFormData, humanizeExamType } from '../../schemas/exam.form'

interface ExamTermOption {
  periodId: string
  name: string
}

interface ExamDrawerProps {
  open: boolean
  onClose: () => void
  schoolId: string
  academicYearId: string
  terms: ExamTermOption[]
  examPattern: string[]
  /** Pass an exam to switch into edit mode. */
  exam?: ExamResponseDto | null
}

const EMPTY_FORM: ExamFormData = {
  examName: '',
  examType: '',
  termId: '',
  gradeLevels: [],
  startDate: '',
  endDate: '',
  description: '',
}

/**
 * Sort a selected gradeLevels[] by the option catalog's order so the persisted
 * value is canonical (and idempotent change-detection in updateExam works on a
 * stable shape).
 */
function sortByCatalog(
  selected: readonly string[],
  catalog: ReadonlyArray<{ value: string }>,
): string[] {
  const selectedSet = new Set(selected)
  return catalog.filter((o) => selectedSet.has(o.value)).map((o) => o.value)
}

function gradeLevelsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function ExamDrawer({
  open,
  onClose,
  schoolId,
  academicYearId,
  terms,
  examPattern,
  exam,
}: ExamDrawerProps) {
  const { t } = useAcademicsI18n()
  const isEdit = !!exam
  const createMutation = useCreateExam()
  const updateMutation = useUpdateExam()
  const mutation = isEdit ? updateMutation : createMutation
  const isPending = mutation.isPending

  // `examType` is server-guarded to draft. Lock the field outside draft so
  // operators don't try a mutation that will 409.
  const examTypeLocked = isEdit && exam.status !== 'draft'

  // ELS.6 — gradeLevels are server-guarded to draft too (EXAM_LOCKED on
  // change post-draft). Mirror the examType lock so the picker is disabled
  // outside Draft instead of letting the operator queue a mutation that 409s.
  const gradeLevelsLocked = examTypeLocked

  const { options: schoolGradeOptions, isLoading: schoolOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId)

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onBlur',
  })

  // Re-seed in edit mode — only when the drawer opens or the target exam
  // changes. examPattern/terms are NOT dependencies here: a background
  // refresh of either must not wipe an in-progress edit.
  useEffect(() => {
    if (!open || !exam) return
    form.reset({
      examName: exam.examName,
      examType: exam.examType,
      termId: exam.termId,
      // ELS.6 — legacy exams created pre-ELS.1 may have undefined gradeLevels;
      // ELS.4 backfill populates them, but the FE degrades to [] in the
      // meantime so the form still mounts.
      gradeLevels: exam.gradeLevels ?? [],
      startDate: exam.startDate,
      endDate: exam.endDate,
      description: exam.description ?? '',
    })
  }, [open, exam, form])

  // Re-seed in create mode — depends on the option lists so the defaults
  // track the latest archetype pattern / terms.
  useEffect(() => {
    if (!open || exam) return
    form.reset({
      ...EMPTY_FORM,
      examType: examPattern[0] ?? '',
      termId: terms[0]?.periodId ?? '',
      gradeLevels: [],
    })
  }, [open, exam, examPattern, terms, form])

  const onSubmit = useCallback(
    async (data: ExamFormData) => {
      try {
        if (isEdit && exam) {
          const patch: UpdateExamDto = {
            examName: data.examName,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.description || undefined,
          }
          // Only include examType if the field is editable AND it actually
          // changed — keeps the request minimal and avoids hitting the
          // status guard on no-op edits.
          if (!examTypeLocked && data.examType !== exam.examType) {
            patch.examType = data.examType as CreateExamDto['examType']
          }
          // ELS.6 — only PATCH gradeLevels when unlocked AND the value
          // actually changed. Same idempotency rationale as examType: the
          // backend lock-on-change check accepts a no-op resend, but
          // dropping a no-op from the wire saves a round trip and is
          // consistent with the existing mutation shape.
          if (
            !gradeLevelsLocked &&
            !gradeLevelsEqual(data.gradeLevels, exam.gradeLevels ?? [])
          ) {
            patch.gradeLevels = data.gradeLevels
          }
          await updateMutation.mutateAsync({ examId: exam.examId, schoolId, data: patch })
        } else {
          const payload: CreateExamDto = {
            examName: data.examName,
            schoolId,
            academicYearId,
            termId: data.termId,
            examType: data.examType as CreateExamDto['examType'],
            gradeLevels: data.gradeLevels,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.description || undefined,
          }
          await createMutation.mutateAsync(payload)
        }
        form.reset()
        onClose()
      } catch {
        // onError toast is handled in the mutation hooks
      }
    },
    [
      isEdit,
      exam,
      examTypeLocked,
      gradeLevelsLocked,
      schoolId,
      academicYearId,
      createMutation,
      updateMutation,
      form,
      onClose,
    ],
  )

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      e.target instanceof HTMLElement &&
      e.target.tagName !== 'TEXTAREA' &&
      e.target.getAttribute('type') !== 'submit'
    ) {
      e.preventDefault()
    }
  }

  const handleClose = () => {
    if (isPending) return
    form.reset()
    onClose()
  }

  const title = isEdit ? t('examModule.drawer.editTitle') : t('examModule.drawer.createTitle')
  const submitLabel = isEdit ? t('actions.saveChanges') : t('examModule.createExam')
  const submittingLabel = isEdit ? t('examModule.drawer.saving') : t('examModule.drawer.creating')

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="exam-drawer-title">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.30)] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose()
            }}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)] flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
                    </div>
                    <h2 id="exam-drawer-title" className="text-lg font-semibold text-text-primary truncate">
                      {title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
                    aria-label={t('examModule.detail.closeDrawer')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <FormProvider {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    onKeyDown={handleFormKeyDown}
                    className="flex flex-col flex-1 min-h-0 overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                      <FormSection title={t('examModule.drawer.detailsTitle')} description={t('examModule.drawer.detailsDescription')}>
                        <div className="space-y-4">
                          <TextField name="examName" label={t('examModule.drawer.examName')} placeholder={t('examModule.drawer.examNamePlaceholder')} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SelectField
                              name="examType"
                              label={t('examModule.detail.fields.type')}
                              placeholder={t('examModule.drawer.selectExamType')}
                              options={examPattern.map((type) => ({
                                value: type,
                                label: t(`examModule.types.${type}`, { defaultValue: humanizeExamType(type) }),
                              }))}
                              disabled={examTypeLocked}
                              helperText={
                                examTypeLocked
                                  ? t('examModule.drawer.examTypeLocked')
                                  : undefined
                              }
                            />
                            <SelectField
                              name="termId"
                              label={t('examModule.detail.fields.term')}
                              placeholder={t('examModule.drawer.selectTerm')}
                              options={terms.map((t) => ({ value: t.periodId, label: t.name }))}
                              disabled={isEdit}
                              helperText={isEdit ? t('examModule.drawer.termLocked') : undefined}
                            />
                          </div>
                        </div>
                      </FormSection>

                      <FormSection
                        title={t('examModule.detail.fields.gradeLevels')}
                        description={t('examModule.drawer.gradeLevelsDescription')}
                      >
                        <GradeLevelsField
                          options={schoolGradeOptions}
                          disabled={gradeLevelsLocked}
                          isLoading={schoolOptionsLoading}
                          helperText={
                            gradeLevelsLocked
                              ? t('examModule.drawer.gradeLevelsLocked')
                              : t('examModule.drawer.gradeLevelsHelper')
                          }
                        />
                      </FormSection>

                      <FormSection title={t('examModule.drawer.scheduleTitle')} description={t('examModule.drawer.scheduleDescription')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DateField name="startDate" label={t('examModule.detail.fields.startDate')} />
                          <DateField name="endDate" label={t('examModule.detail.fields.endDate')} />
                        </div>
                      </FormSection>

                      <FormSection title={t('examModule.detail.fields.description')} description={t('examModule.drawer.descriptionDescription')}>
                        <TextareaField name="description" label={t('examModule.detail.fields.description')} placeholder={t('examModule.drawer.descriptionPlaceholder')} />
                      </FormSection>
                    </div>

                    <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-surface-secondary/50">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors disabled:opacity-50"
                      >
                        {t('actions.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {submittingLabel}
                          </>
                        ) : (
                          submitLabel
                        )}
                      </button>
                    </div>
                  </form>
                </FormProvider>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// ELS.6 — GradeLevelsField (inline; only used by ExamDrawer)
// ============================================================================

interface GradeLevelsFieldProps {
  options: ReadonlyArray<{ value: string; label: string }>
  disabled?: boolean
  isLoading?: boolean
  helperText?: string
}

/**
 * Multi-select chip-toggle picker for `Exam.gradeLevels`. Sourced from
 * `useSchoolEnabledGradeOptions(schoolId)` so operators can only pick codes
 * the school actually operates — backend would reject anything else with
 * EXAM_GRADE_LEVEL_NOT_ENABLED, this surfaces the constraint at the UI.
 */
function GradeLevelsField({
  options,
  disabled = false,
  isLoading = false,
  helperText,
}: GradeLevelsFieldProps) {
  const { t } = useAcademicsI18n()
  const { control } = useFormContext<ExamFormData>()

  return (
    <Controller
      name="gradeLevels"
      control={control}
      render={({ field, fieldState }) => {
        const value: string[] = field.value ?? []
        const selectedSet = new Set(value)

        const toggle = (code: string) => {
          if (disabled) return
          const next = new Set(selectedSet)
          if (next.has(code)) next.delete(code)
          else next.add(code)
          field.onChange(sortByCatalog(Array.from(next), options))
          // RHF Controller doesn't fire onBlur on button clicks; trigger it
          // so the resolver re-runs and clears the "required" error eagerly.
          field.onBlur()
        }

        if (isLoading) {
          return (
            <div className="flex items-center gap-2 text-sm text-text-tertiary py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('examModule.drawer.loadingGradeLevels')}
            </div>
          )
        }

        return (
          <div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('examModule.detail.fields.gradeLevels')}>
              {options.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  {t('examModule.drawer.noGradeLevels')}
                </p>
              ) : (
                options.map((option) => {
                  const selected = selectedSet.has(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggle(option.value)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={[
                        'px-3 py-1.5 text-sm font-medium rounded-full border transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]',
                        selected
                          ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] border-[rgb(var(--border-focus))]'
                          : 'bg-surface-primary text-text-secondary border-border-primary hover:border-[rgb(var(--border-focus))] hover:text-text-primary',
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  )
                })
              )}
            </div>
            {fieldState.error?.message ? (
              <p className="text-xs text-[rgb(var(--state-danger-fg))] mt-2">
                {fieldState.error.message}
              </p>
            ) : helperText ? (
              <p className="text-xs text-text-tertiary mt-2">{helperText}</p>
            ) : null}
          </div>
        )
      }}
    />
  )
}
