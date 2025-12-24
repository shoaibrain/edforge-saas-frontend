/**
 * Wizard Progress Components
 * 
 * Step indicators for desktop and mobile views.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useWizardContext } from './WizardContext'
import { cn } from './utils'
import type { WizardStepStatus } from './types'

// ============================================================================
// DESKTOP PROGRESS
// ============================================================================

export interface WizardProgressProps {
  /** Additional class name */
  className?: string
  /** Variant style */
  variant?: 'default' | 'compact' | 'numbered'
}

export function WizardProgress({
  className,
  variant = 'default',
}: WizardProgressProps) {
  const { visibleSteps, getStepStatus, canGoToStep, goToStep, currentStep: _currentStep } = useWizardContext()
  void _currentStep // Suppress unused var

  return (
    <nav
      aria-label="Progress"
      className={cn('max-w-4xl mx-auto px-6', className)}
    >
      <ol className="flex items-center justify-between" role="list">
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = canGoToStep(index)

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex-1',
                index !== visibleSteps.length - 1 && 'pr-8 sm:pr-20'
              )}
            >
              {/* Connector Line */}
              {index !== visibleSteps.length - 1 && (
                <div
                  className="absolute top-5 left-1/2 -right-1/2 h-0.5 bg-[rgb(var(--border-secondary))]"
                  aria-hidden="true"
                >
                  {status === 'completed' && (
                    <motion.div
                      className="h-full bg-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  )}
                </div>
              )}

              {/* Step */}
              <button
                type="button"
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={cn(
                  'group relative flex flex-col items-center',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {/* Step Icon */}
                <StepIcon
                  step={step}
                  status={status}
                  index={index}
                  variant={variant}
                />

                {/* Step Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium truncate max-w-[80px] sm:max-w-none text-center',
                    status === 'current' && 'text-teal-600 dark:text-cyan-400',
                    status === 'completed' && 'text-[rgb(var(--text-primary))]',
                    status === 'pending' && 'text-[rgb(var(--text-tertiary))]',
                    status === 'error' && 'text-rust-500'
                  )}
                >
                  {step.title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ============================================================================
// STEP ICON
// ============================================================================

interface StepIconProps {
  step: { icon: React.ComponentType<{ className?: string }> }
  status: WizardStepStatus
  index: number
  variant: 'default' | 'compact' | 'numbered'
}

function StepIcon({ step, status, index, variant }: StepIconProps) {
  const Icon = step.icon

  return (
    <motion.span
      className={cn(
        'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
        status === 'current' && 'border-teal-500 bg-teal-500/10 dark:bg-cyan-500/15',
        status === 'completed' && 'border-teal-500 bg-teal-500',
        status === 'pending' && 'border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-secondary))]',
        status === 'error' && 'border-rust-500 bg-rust-500/10'
      )}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {status === 'completed' ? (
        <Check className="h-5 w-5 text-white" aria-hidden="true" />
      ) : variant === 'numbered' ? (
        <span
          className={cn(
            'text-sm font-semibold',
            status === 'current' && 'text-teal-600 dark:text-cyan-400',
            status === 'pending' && 'text-[rgb(var(--text-tertiary))]',
            status === 'error' && 'text-rust-500'
          )}
        >
          {index + 1}
        </span>
      ) : (
        <Icon
          className={cn(
            'h-5 w-5',
            status === 'current' && 'text-teal-600 dark:text-cyan-400',
            status === 'pending' && 'text-[rgb(var(--text-tertiary))]',
            status === 'error' && 'text-rust-500'
          )}
          aria-hidden="true"
        />
      )}
    </motion.span>
  )
}

// ============================================================================
// COMPACT PROGRESS (Mobile)
// ============================================================================

export interface WizardProgressCompactProps {
  /** Additional class name */
  className?: string
}

export function WizardProgressCompact({ className }: WizardProgressCompactProps) {
  const { visibleSteps, currentStep, currentStepData } = useWizardContext()

  const progress = ((currentStep + 1) / visibleSteps.length) * 100

  return (
    <div className={cn('px-6', className)}>
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[rgb(var(--surface-tertiary))] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step Info */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <currentStepData.icon className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {currentStepData.title}
          </span>
        </div>
        <span className="text-xs text-[rgb(var(--text-tertiary))]">
          Step {currentStep + 1} of {visibleSteps.length}
        </span>
      </div>
    </div>
  )
}

