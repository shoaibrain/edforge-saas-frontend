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
import { useSectionGrades, useBulkFinalizeGrades } from '../../hooks/useGrades'

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
  const [errorCount, setErrorCount] = useState(0)
  const bulkFinalizeMutation = useBulkFinalizeGrades()

  const { data: gradebook, isLoading } = useSectionGrades(
    sectionId,
    { schoolId, termId },
    open && !!sectionId && !!schoolId
  )

  const grades = gradebook?.grades ?? []

  // Categorize grades — distinguish real zeros from empty stubs
  const analysis = useMemo(() => {
    const finalizedGrades = grades.filter((g) => g.isFinal)
    const unfinalizedGrades = grades.filter((g) => !g.isFinal)

    // Students with grade documents but no scored assignments (roster stubs)
    const emptyStubs = unfinalizedGrades.filter((g) => {
      const scored = g.assignments?.filter((a) => a.earnedPoints !== undefined) ?? []
      return scored.length === 0
    })

    // Students with at least one scored assignment — these are eligible for finalization
    const eligibleGrades = unfinalizedGrades.filter((g) => {
      const scored = g.assignments?.filter((a) => a.earnedPoints !== undefined) ?? []
      return scored.length > 0
    })

    // Students with real grades that are low/zero
    const lowGrades = eligibleGrades.filter(
      (g) => g.numericGrade !== undefined && g.numericGrade < 60
    )

    return {
      finalizedGrades,
      unfinalizedGrades,
      eligibleGrades,
      emptyStubs,
      lowGrades,
      total: grades.length,
    }
  }, [grades])

  const isProcessing = bulkFinalizeMutation.isPending

  const handleFinalize = async () => {
    try {
      const result = await bulkFinalizeMutation.mutateAsync({
        sectionId,
        termId,
        schoolId,
      })
      setFinalizedCount(result.finalized)
      setErrorCount(result.errors.length)
      setStep('complete')
    } catch {
      // Error handled by mutation hook toast
    }
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

                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-teal-600">{analysis.eligibleGrades.length}</p>
                        <p className="text-xs text-text-tertiary">To Finalize</p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-emerald-600">{analysis.finalizedGrades.length}</p>
                        <p className="text-xs text-text-tertiary">Already Final</p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className={`text-2xl font-bold ${analysis.emptyStubs.length > 0 ? 'text-text-tertiary' : 'text-emerald-600'}`}>
                          {analysis.emptyStubs.length}
                        </p>
                        <p className="text-xs text-text-tertiary">No Scores</p>
                      </div>
                    </div>

                    {/* Empty stubs warning */}
                    {analysis.emptyStubs.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-surface-secondary rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-text-tertiary mt-0.5" />
                        <p className="text-xs text-text-secondary">
                          {analysis.emptyStubs.length} student(s) have no scored assignments and will be skipped.
                        </p>
                      </div>
                    )}

                    {/* Low grades warning */}
                    {analysis.lowGrades.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {analysis.lowGrades.length} student(s) are below passing grade.
                        </p>
                      </div>
                    )}

                    {/* Student-level preview table */}
                    {analysis.eligibleGrades.length > 0 && (
                      <div className="rounded-lg border border-border-secondary overflow-hidden max-h-[250px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-secondary sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">Student</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">Grade</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">Letter</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-secondary">
                            {analysis.eligibleGrades.map((g) => {
                              const isPassing = g.numericGrade !== undefined && g.numericGrade >= 60
                              return (
                                <tr key={g.gradeId}>
                                  <td className="px-3 py-2 text-text-primary">
                                    {g.studentName || `Student`}
                                  </td>
                                  <td className="px-3 py-2 text-center font-medium text-text-primary">
                                    {g.numericGrade !== undefined ? `${g.numericGrade.toFixed(1)}%` : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-center font-bold text-text-primary">
                                    {g.letterGrade || '—'}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isPassing
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                                    }`}>
                                      {isPassing ? 'Pass' : 'Fail'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {analysis.eligibleGrades.length === 0 && analysis.finalizedGrades.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                          All grades are already finalized!
                        </p>
                      </div>
                    )}

                    {analysis.eligibleGrades.length === 0 && analysis.finalizedGrades.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-text-tertiary" />
                        <p className="text-sm text-text-secondary">
                          No students have scored assignments to finalize.
                        </p>
                      </div>
                    )}
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
                      You are about to finalize <strong>{analysis.eligibleGrades.length}</strong> grade(s).
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
                  {errorCount > 0 && (
                    <span className="block mt-1 text-amber-600 dark:text-amber-400">
                      {errorCount} grade(s) could not be finalized.
                    </span>
                  )}
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
                disabled={analysis.eligibleGrades.length === 0 || isLoading}
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
                Finalize {analysis.eligibleGrades.length} Grades
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
