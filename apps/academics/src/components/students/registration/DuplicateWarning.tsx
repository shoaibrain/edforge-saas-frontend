/**
 * DuplicateWarning Component (Sprint 4)
 *
 * Shows potential duplicate matches found during registration.
 * Displayed after Step 1 (Personal Info) if de-dup check returns matches.
 * Users can dismiss the warning and continue registration.
 */

import { AlertTriangle, User, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DuplicateMatch } from '../../../services/academics.service'
import { useAcademicsI18n } from '../../../lib/i18n'

interface DuplicateWarningProps {
  matches: DuplicateMatch[]
  isLoading?: boolean
  onDismiss: () => void
  onViewStudent?: (studentId: string) => void
}

const confidenceStyles = {
  high: {
    badge: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] border-[rgb(var(--state-danger-border))]/20',
    labelKey: 'enrollmentModule.duplicate.confidence.high',
  },
  medium: {
    badge: 'bg-[rgb(var(--state-warning-fg))]/10 text-[rgb(var(--state-warning-fg))] border-amber-500/20',
    labelKey: 'enrollmentModule.duplicate.confidence.medium',
  },
  low: {
    badge: 'bg-[rgb(var(--background-tertiary)/0.1)] text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))] border-[rgb(var(--border-secondary))]',
    labelKey: 'enrollmentModule.duplicate.confidence.low',
  },
}

export function DuplicateWarning({
  matches,
  isLoading = false,
  onDismiss,
  onViewStudent,
}: DuplicateWarningProps) {
  const { t, formatDate, formatNumber } = useAcademicsI18n()

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-6"
      >
        <div className="p-4 rounded-xl bg-[rgb(var(--state-warning-fg))]/5 border border-amber-500/15 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[rgb(var(--state-warning-fg))]">
            {t('enrollmentModule.duplicate.checking')}
          </p>
        </div>
      </motion.div>
    )
  }

  if (matches.length === 0) return null

  const highConfidence = matches.filter((m) => m.confidence === 'high')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <div
          className={`rounded-xl border ${
            highConfidence.length > 0
              ? 'bg-[rgb(var(--state-danger-fg)/0.05)] border-[rgb(var(--state-danger-border))]/15'
              : 'bg-[rgb(var(--state-warning-fg))]/5 border-amber-500/15'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 pb-2">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  highConfidence.length > 0
                    ? 'text-[rgb(var(--state-danger-fg))]'
                    : 'text-amber-500'
                }`}
              />
              <div>
                <h4
                  className={`text-sm font-semibold ${
                    highConfidence.length > 0
                      ? 'text-[rgb(var(--state-danger-fg))]'
                      : 'text-[rgb(var(--state-warning-fg))]'
                  }`}
                >
                  {highConfidence.length > 0
                    ? t('enrollmentModule.duplicate.possibleDuplicate')
                    : t('enrollmentModule.duplicate.similarRecords')}
                </h4>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  {matches.length === 1
                    ? t('enrollmentModule.duplicate.singleMatch')
                    : t('enrollmentModule.duplicate.multipleMatches', { count: formatNumber(matches.length) })}{' '}
                  {t('enrollmentModule.duplicate.continueNew')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] rounded transition-colors"
              aria-label={t('enrollmentModule.duplicate.dismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Match list */}
          <div className="px-4 pb-4 space-y-2">
            {matches.map((match) => {
              const style = confidenceStyles[match.confidence]
              return (
                <div
                  key={match.studentId}
                  className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--background-primary))]/60 border border-[rgb(var(--border-tertiary))]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[rgb(var(--background-tertiary))] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                        {match.firstName} {match.lastName}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {t('enrollmentModule.duplicate.dob', { date: formatDate(match.dateOfBirth) })}
                        {match.currentGradeLevel && ` · ${t('enrollmentModule.duplicate.grade', { grade: match.currentGradeLevel })}`}
                        {match.status && ` · ${match.status}`}
                      </p>
                      {match.matchReasons.length > 0 && (
                        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                          {t('enrollmentModule.duplicate.match', { reasons: match.matchReasons.join(', ') })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}
                    >
                      {t(style.labelKey)}
                    </span>
                    {onViewStudent && (
                      <button
                        type="button"
                        onClick={() => onViewStudent(match.studentId)}
                        className="p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] rounded transition-colors"
                        aria-label={t('enrollmentModule.duplicate.viewStudent', { name: `${match.firstName} ${match.lastName}` })}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
