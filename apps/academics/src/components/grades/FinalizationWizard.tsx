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
import { useAcademicsI18n } from '../../lib/i18n'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'

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
  const { t, formatNumber } = useAcademicsI18n()
  const [step, setStep] = useState<WizardStep>('review')
  const [finalizedCount, setFinalizedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const bulkFinalizeMutation = useBulkFinalizeGrades()
  useEscapeToClose(onClose, open)

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finalize-grades-title"
    >
      <div className="bg-surface-primary rounded-xl border border-border-secondary shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]" />
            <h3 id="finalize-grades-title" className="text-lg font-semibold text-text-primary">
              {termName
                ? t('gradesModule.finalization.titleWithTerm', { termName })
                : t('gradesModule.finalization.title')}
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
                    <p className="text-sm text-text-secondary mt-2">
                      {t('gradesModule.finalization.loading')}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary">
                      {t('gradesModule.finalization.reviewDescription')}
                    </p>

                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-[rgb(var(--action-secondary-fg))]">
                          {formatNumber(analysis.eligibleGrades.length)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {t('gradesModule.finalization.toFinalize')}
                        </p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className="text-2xl font-bold text-[rgb(var(--state-success-fg))]">
                          {formatNumber(analysis.finalizedGrades.length)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {t('gradesModule.finalization.alreadyFinal')}
                        </p>
                      </div>
                      <div className="p-3 bg-surface-secondary rounded-lg text-center">
                        <p className={`text-2xl font-bold ${analysis.emptyStubs.length > 0 ? 'text-text-tertiary' : 'text-[rgb(var(--state-success-fg))]'}`}>
                          {formatNumber(analysis.emptyStubs.length)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {t('gradesModule.finalization.noScores')}
                        </p>
                      </div>
                    </div>

                    {/* Empty stubs warning */}
                    {analysis.emptyStubs.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-surface-secondary rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-text-tertiary mt-0.5" />
                        <p className="text-xs text-text-secondary">
                          {t('gradesModule.finalization.emptyStubsWarning', {
                            count: formatNumber(analysis.emptyStubs.length),
                          })}
                        </p>
                      </div>
                    )}

                    {/* Low grades warning */}
                    {analysis.lowGrades.length > 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-[rgb(var(--state-warning-fg))]/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <p className="text-xs text-[rgb(var(--state-warning-fg))]">
                          {t('gradesModule.finalization.lowGradesWarning', {
                            count: formatNumber(analysis.lowGrades.length),
                          })}
                        </p>
                      </div>
                    )}

                    {/* Student-level preview table */}
                    {analysis.eligibleGrades.length > 0 && (
                      <div className="rounded-lg border border-border-secondary overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-secondary sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary">
                                {t('gradesModule.finalization.columns.student')}
                              </th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">
                                {t('gradesModule.finalization.columns.grade')}
                              </th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">
                                {t('gradesModule.finalization.columns.letter')}
                              </th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-text-secondary">
                                {t('gradesModule.finalization.columns.status')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-secondary">
                            {analysis.eligibleGrades.map((g) => {
                              const isPassing = g.numericGrade !== undefined && g.numericGrade >= 60
                              return (
                                <tr key={g.gradeId}>
                                  <td className="px-3 py-2 text-text-primary">
                                    {g.studentName || t('gradesModule.management.studentFallback')}
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
                                        ? 'bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] '
                                        : 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] '
                                    }`}>
                                      {isPassing
                                        ? t('gradesModule.finalization.pass')
                                        : t('gradesModule.finalization.fail')}
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
                      <div className="flex items-center gap-2 p-3 bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-bg)/0.18)] rounded-lg">
                        <CheckCircle className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
                        <p className="text-sm text-[rgb(var(--state-success-fg))] ">
                          {t('gradesModule.finalization.allFinalized')}
                        </p>
                      </div>
                    )}

                    {analysis.eligibleGrades.length === 0 && analysis.finalizedGrades.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-surface-secondary rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-text-tertiary" />
                        <p className="text-sm text-text-secondary">
                          {t('gradesModule.finalization.noneToFinalize')}
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
                <div className="flex items-start gap-3 p-4 bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)] rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--state-danger-fg))] ">
                      {t('gradesModule.finalization.irreversibleTitle')}
                    </p>
                    <p className="text-sm text-[rgb(var(--state-danger-fg))] text-[rgb(var(--state-danger-fg))] mt-1">
                      {t('gradesModule.finalization.irreversibleBefore')}{' '}
                      <strong>{formatNumber(analysis.eligibleGrades.length)}</strong>{' '}
                      {t('gradesModule.finalization.irreversibleAfter')}
                    </p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="py-4 text-center">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-[rgb(var(--action-secondary-fg))]" />
                    <p className="text-sm text-text-secondary mt-2">
                      {t('gradesModule.finalization.finalizing')}
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
                <CheckCircle className="w-12 h-12 mx-auto text-[rgb(var(--state-success-fg))]" />
                <h4 className="text-lg font-semibold text-text-primary">
                  {t('gradesModule.finalization.completeTitle')}
                </h4>
                <p className="text-sm text-text-secondary">
                  {t('gradesModule.finalization.completeDescription', {
                    count: formatNumber(finalizedCount),
                  })}
                  {errorCount > 0 && (
                    <span className="block mt-1 text-[rgb(var(--state-warning-fg))]">
                      {t('gradesModule.finalization.errorCount', {
                        count: formatNumber(errorCount),
                      })}
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
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={analysis.eligibleGrades.length === 0 || isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('gradesModule.finalization.continue')}
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
                {t('gradesModule.finalization.back')}
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-fg))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {t('gradesModule.finalization.finalizeGrades', {
                  count: formatNumber(analysis.eligibleGrades.length),
                })}
              </button>
            </>
          )}
          {step === 'complete' && (
            <div className="ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors"
              >
                {t('gradesModule.finalization.done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
