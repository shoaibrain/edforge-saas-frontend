/**
 * Wizard Navigation Components
 * 
 * Back/Next/Submit buttons for wizard navigation.
 */

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { useWizardContext } from './WizardContext'
import { cn } from './utils'

// ============================================================================
// NAVIGATION (Inline)
// ============================================================================

export interface WizardNavigationProps {
  /** Submit button text */
  submitText?: string
  /** Back button text */
  backText?: string
  /** Next button text */
  nextText?: string
  /** Additional class name */
  className?: string
  /** Hide back button */
  hideBack?: boolean
}

export function WizardNavigation({
  submitText = 'Submit',
  backText = 'Back',
  nextText = 'Continue',
  className,
  hideBack = false,
}: WizardNavigationProps) {
  const { currentStep, visibleSteps, goToNext, goToBack, submit, isSubmitting } = useWizardContext()

  const isFirst = currentStep === 0
  const isLast = currentStep === visibleSteps.length - 1

  const handleNext = async () => {
    if (isLast) {
      await submit()
    } else {
      await goToNext()
    }
  }

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Back Button */}
      {!hideBack && (
        <motion.button
          type="button"
          onClick={goToBack}
          disabled={isFirst || isSubmitting}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'text-[rgb(var(--text-secondary))]',
            'hover:bg-[rgb(var(--interactive-hover))]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4" />
          {backText}
        </motion.button>
      )}

      {/* Spacer when back is hidden */}
      {hideBack && <div />}

      {/* Next/Submit Button */}
      <motion.button
        type="button"
        onClick={handleNext}
        disabled={isSubmitting}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium',
          'bg-amber-500 text-white',
          'hover:bg-amber-600',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          'min-w-[120px] justify-center'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isLast ? (
          <>
            <Check className="w-4 h-4" />
            {submitText}
          </>
        ) : (
          <>
            {nextText}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </div>
  )
}

// ============================================================================
// FOOTER (Fixed)
// ============================================================================

export interface WizardFooterProps extends WizardNavigationProps {
  /** Whether footer is fixed to bottom */
  fixed?: boolean
}

export function WizardFooter({
  fixed = false,
  ...props
}: WizardFooterProps) {
  return (
    <div
      className={cn(
        'bg-[rgb(var(--surface-secondary))] border-t border-[rgb(var(--border-primary))]',
        fixed && 'fixed bottom-0 left-0 right-0 z-50'
      )}
    >
      <div className="max-w-3xl mx-auto px-6 py-4">
        <WizardNavigation {...props} />
      </div>
    </div>
  )
}

