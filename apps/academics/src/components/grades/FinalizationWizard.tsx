/**
 * FinalizationWizard Component
 *
 * Modal wizard for finalizing grades for a term.
 * Steps: Select Term -> Review Missing Grades -> Confirm -> Bulk Finalize
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Lock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { useSectionGrades, useFinalizeGrade } from '../../hooks/useGrades'

// ============================================================================
// TYPES
// ============================================================================

interface FinalizationWizardProps {
  open: boolean
  onClose: () => void
  sectionId: string
  schoolId: string
  termId: string
  termName?: string
}

type WizardStep = 'review' | 'confirm' | 'complete'

// ============================================================================
// COMPONENT
// ============================================================================

export function FinalizationWizard({
  open,
  onClose,
  sectionId,
  schoolId,
  termId,
  termName,
}: FinalizationWizardProps) {
  const [step, setStep] = useState<WizardStep>('review')
  const [finalizedCount, setFinalizedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const finalizeMutation = useFinalizeGrade()

  const { data: gradebook, isLoading } = useSectionGrades(
    sectionId,
    { schoolId, termId },
    open && !!sectionId && !!schoolId
  )

  const grades = gradebook?.grades ?? []

  // Categorize grades
  const analysis = useMemo(() => {
    const unfinalizedGrades = grades.filter((g) => !g.isFinal)
    const finalizedGrades = grades.filter((g) => g.isFinal)
    const missingGrades = grades.filter(
      (g) => g.numericGrade === 0 || g.numericGrade === undefined
    )
    return { unfinalizedGrades, finalizedGrades, missingGrades, total: grades.length }
  }, [grades])

  const handleFinalize = async () => {
    setIsProcessing(true)
    let count = 0
    for (const grade of analysis.unfinalizedGrades) {
      try {
        await finalizeMutation.mutateAsync(grade.gradeId)
        count++
      } catch {
        // Continue on error
      }
    }
    setFinalizedCount(count)
    setIsProcessing(false)
    setStep('complete')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-primary rounded-xl border border-border-secondary shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-500" />
            <h3 className="text-lg font-semibold text-text-primary">
              Finalize Grades{termName ? ` — ${termName}` : ''}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {/* Step 1: Review */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-text-tertiary" />
                    <p className="text-sm text-text-secondary mt-2">Loading grades...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary">
                      Review grades before finalizing. Finalized grades are locked and cannot be changed.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-text-primary">{analysis.total}</p>
                        <p className="text-xs text-text-tertiary">Total Grades</p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-emerald-600">{analysis.finalizedGrades.length}</p>
                        <p className="text-xs text-text-tertiary">Already Final</p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-teal-600">{analysis.unfinalizedGrades.length}</p>
                        <p className="text-xs text-text-tertiary">To Finalize</p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className={`text-2xl font-bold ${analysis.missingGrades.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {analysis.missingGrades.length}
                        </p>
                        <p className="text-xs text-text-tertiary">Missing/Zero</p>
                      </div>
                    </div>

                    {analysis.missingGrades.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {analysis.missingGrades.length} student(s) have missing or zero grades
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                            These grades will be finalized as-is. Review before proceeding.
                          </p>
                        </div>
                      </div>
                    )}

                    {analysis.unfinalizedGrades.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                          All grades are already finalized!
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Confirm */}
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      This action cannot be undone
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      You are about to finalize <strong>{analysis.unfinalizedGrades.length}</strong> grade(s).
                      Finalized grades are locked and cannot be modified.
                    </p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="py-4 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-teal-500" />
                    <p className="text-sm text-text-secondary mt-2">
                      Finalizing grades...
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="py-4 text-center space-y-3"
              >
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
                <h4 className="text-lg font-semibold text-text-primary">
                  Grades Finalized
                </h4>
                <p className="text-sm text-text-secondary">
                  Successfully finalized {finalizedCount} grade(s). These grades are now locked.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-secondary">
          {step === 'review' && (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={analysis.unfinalizedGrades.length === 0 || isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <button
                type="button"
                onClick={() => setStep('review')}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Finalize {analysis.unfinalizedGrades.length} Grades
              </button>
            </>
          )}
          {step === 'complete' && (
            <div className="ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
