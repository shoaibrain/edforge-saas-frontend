/**
 * ExamDrawer — create-exam slide-over.
 *
 * Slice 1 is create-only. Exam detail (courses, scores, results) lands in
 * later slices. academicYearId + schoolId come from the page; the form
 * collects name, type, term, dates, description.
 */

import { useCallback } from 'react'
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
import type { CreateExamDto } from '@aibrains/shared-types'
import { useCreateExam } from '../../hooks/useExams'
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
}

export function ExamDrawer({ open, onClose, schoolId, academicYearId, terms, examPattern }: ExamDrawerProps) {
  const createMutation = useCreateExam()

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      examName: '',
      examType: examPattern[0] ?? '',
      termId: terms[0]?.periodId ?? '',
      startDate: '',
      endDate: '',
      description: '',
    },
    mode: 'onBlur',
  })

  const onSubmit = useCallback(
    async (data: ExamFormData) => {
      const payload: CreateExamDto = {
        examName: data.examName,
        schoolId,
        academicYearId,
        termId: data.termId,
        // examType values come from the archetype exam-pattern, which is a
        // subset of the CreateExamDto enum — safe to narrow here.
        examType: data.examType as CreateExamDto['examType'],
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description || undefined,
      }
      await createMutation.mutateAsync(payload)
      form.reset()
      onClose()
    },
    [schoolId, academicYearId, createMutation, form, onClose]
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
    if (createMutation.isPending) return
    form.reset()
    onClose()
  }

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
                      Create Exam
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
                            />
                            <SelectField
                              name="termId"
                              label="Term"
                              placeholder="Select term"
                              options={terms.map((t) => ({ value: t.periodId, label: t.name }))}
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
                        disabled={createMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        {createMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          'Create Exam'
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
