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
  zodResolver,
  TextField,
  SelectField,
  DateField,
  TextareaField,
  FormSection,
} from '@edforge/forms'
import type { CreateExamDto, ExamResponseDto, UpdateExamDto } from '@aibrains/shared-types'
import { useCreateExam, useUpdateExam } from '../../hooks/useExams'
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
  startDate: '',
  endDate: '',
  description: '',
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
  const isEdit = !!exam
  const createMutation = useCreateExam()
  const updateMutation = useUpdateExam()
  const mutation = isEdit ? updateMutation : createMutation
  const isPending = mutation.isPending

  // `examType` is server-guarded to draft. Lock the field outside draft so
  // operators don't try a mutation that will 409.
  const examTypeLocked = isEdit && exam.status !== 'draft'

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onBlur',
  })

  // Re-seed the form whenever the drawer opens — switching between create
  // and edit, or between two exams, must reset prior field state.
  useEffect(() => {
    if (!open) return
    if (exam) {
      form.reset({
        examName: exam.examName,
        examType: exam.examType,
        termId: exam.termId,
        startDate: exam.startDate,
        endDate: exam.endDate,
        description: exam.description ?? '',
      })
    } else {
      form.reset({
        ...EMPTY_FORM,
        examType: examPattern[0] ?? '',
        termId: terms[0]?.periodId ?? '',
      })
    }
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
          await updateMutation.mutateAsync({ examId: exam.examId, schoolId, data: patch })
        } else {
          const payload: CreateExamDto = {
            examName: data.examName,
            schoolId,
            academicYearId,
            termId: data.termId,
            examType: data.examType as CreateExamDto['examType'],
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

  const title = isEdit ? 'Edit Exam' : 'Create Exam'
  const submitLabel = isEdit ? 'Save Changes' : 'Create Exam'
  const submittingLabel = isEdit ? 'Saving…' : 'Creating…'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="exam-drawer-title">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
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
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 id="exam-drawer-title" className="text-lg font-semibold text-text-primary truncate">
                      {title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
                    aria-label="Close drawer"
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
                      <FormSection title="Exam Details" description="Name this exam and choose its type and term.">
                        <div className="space-y-4">
                          <TextField name="examName" label="Exam Name" placeholder="e.g., First Term Exam" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SelectField
                              name="examType"
                              label="Exam Type"
                              placeholder="Select exam type"
                              options={examPattern.map((t) => ({ value: t, label: humanizeExamType(t) }))}
                              disabled={examTypeLocked}
                              helperText={
                                examTypeLocked
                                  ? 'Locked: exam type can only change while the exam is in Draft.'
                                  : undefined
                              }
                            />
                            <SelectField
                              name="termId"
                              label="Term"
                              placeholder="Select term"
                              options={terms.map((t) => ({ value: t.periodId, label: t.name }))}
                              disabled={isEdit}
                              helperText={isEdit ? 'Term cannot be changed after creation.' : undefined}
                            />
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="Schedule" description="When does this exam run?">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <DateField name="startDate" label="Start Date" />
                          <DateField name="endDate" label="End Date" />
                        </div>
                      </FormSection>

                      <FormSection title="Description" description="Optional notes about this exam.">
                        <TextareaField name="description" label="Description" placeholder="Optional description…" />
                      </FormSection>
                    </div>

                    <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-surface-secondary/50">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
