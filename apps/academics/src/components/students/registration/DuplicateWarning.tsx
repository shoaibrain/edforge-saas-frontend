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

interface DuplicateWarningProps {
  matches: DuplicateMatch[]
  isLoading?: boolean
  onDismiss: () => void
  onViewStudent?: (studentId: string) => void
}

const confidenceStyles = {
  high: {
    badge: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] border-[rgb(var(--state-danger-border))]/20',
    label: 'High',
  },
  medium: {
    badge: 'bg-[rgb(var(--state-warning-fg))]/10 text-[rgb(var(--state-warning-fg))] border-amber-500/20',
    label: 'Medium',
  },
  low: {
    badge: 'bg-[rgb(var(--surface-tertiary))]0/10 text-slate-600 dark:text-[rgb(var(--text-tertiary))] border-slate-500/20',
    label: 'Low',
  },
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function DuplicateWarning({
  matches,
  isLoading = false,
  onDismiss,
  onViewStudent,
}: DuplicateWarningProps) {
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
            Checking for existing student records...
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
              ? 'bg-[rgb(var(--state-danger-bg)/0.18)]0/5 border-[rgb(var(--state-danger-border))]/15'
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
                    ? 'Possible Duplicate Found'
                    : 'Similar Records Found'}
                </h4>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  {matches.length === 1
                    ? 'A student with similar information already exists.'
                    : `${matches.length} students with similar information were found.`}{' '}
                  You can continue if this is a new student.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] rounded transition-colors"
              aria-label="Dismiss warning"
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
                  className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-primary))]/60 border border-[rgb(var(--border-tertiary))]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[rgb(var(--surface-tertiary))] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                        {match.firstName} {match.lastName}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        DOB: {formatDate(match.dateOfBirth)}
                        {match.currentGradeLevel && ` · Grade ${match.currentGradeLevel}`}
                        {match.status && ` · ${match.status}`}
                      </p>
                      {match.matchReasons.length > 0 && (
                        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                          Match: {match.matchReasons.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}
                    >
                      {style.label}
                    </span>
                    {onViewStudent && (
                      <button
                        type="button"
                        onClick={() => onViewStudent(match.studentId)}
                        className="p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] rounded transition-colors"
                        aria-label={`View ${match.firstName} ${match.lastName}`}
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
