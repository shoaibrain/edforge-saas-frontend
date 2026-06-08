/**
 * Wizard Modal Component
 * 
 * Modal-based wizard for quick multi-step workflows.
 */

import { Suspense, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { WizardProvider, useWizardContext } from './WizardContext'
import { WizardProgressCompact } from './WizardProgress'
import { WizardNavigation } from './WizardNavigation'
import { cn } from './utils'
import type { WizardModalProps } from './types'

// ============================================================================
// MODAL STEP CONTAINER
// ============================================================================

function ModalStepContainer() {
  const {
    currentStep,
    currentStepData,
    formData,
    updateData,
    goToNext,
    goToBack,
    errors,
    clearError,
    visibleSteps,
  } = useWizardContext()
  
  const StepComponent = currentStepData.component
  const isFirst = currentStep === 0
  const isLast = currentStep === visibleSteps.length - 1

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <StepComponent
          data={formData}
          updateData={updateData}
          onNext={goToNext}
          onBack={goToBack}
          isFirst={isFirst}
          isLast={isLast}
          errors={errors}
          clearError={clearError}
        />
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// MODAL CONTENT
// ============================================================================

interface ModalContentProps {
  title?: string
  description?: string
  submitText?: string
  onClose: () => void
}

function ModalContent({
  title,
  description,
  submitText = 'Submit',
  onClose,
}: ModalContentProps) {
  const { currentStepData } = useWizardContext()

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-[rgb(var(--border-secondary))]">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-teal-500/10 dark:bg-cyan-500/15">
            <currentStepData.icon className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {title || currentStepData.title}
            </h2>
            {(description || currentStepData.description) && (
              <p className="mt-1 text-sm text-[rgb(var(--text-tertiary))]">
                {description || currentStepData.description}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'p-2 rounded-lg',
            'text-[rgb(var(--text-tertiary))]',
            'hover:bg-[rgb(var(--background-tertiary))]',
            'transition-colors'
          )}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 py-3 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-tertiary))]">
        <WizardProgressCompact />
      </div>

      {/* Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
          }
        >
          <ModalStepContainer />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-[rgb(var(--background-tertiary))] border-t border-[rgb(var(--border-secondary))]">
        <WizardNavigation submitText={submitText} />
      </div>
    </>
  )
}

// ============================================================================
// MAIN WIZARD MODAL
// ============================================================================

export function WizardModal({
  open,
  onClose,
  steps,
  initialData,
  onSubmit,
  onCancel,
  title,
  description,
  submitText = 'Submit',
  size = 'md',
}: WizardModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  const handleCancel = () => {
    onCancel?.()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Full-screen container for centering */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'w-full pointer-events-auto',
                'bg-[rgb(var(--background-secondary))] rounded-2xl shadow-2xl overflow-hidden',
                sizeClasses[size]
              )}
              onClick={(e) => e.stopPropagation()}
            >
            <WizardProvider
              steps={steps}
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={handleCancel}
            >
              <ModalContent
                title={title}
                description={description}
                submitText={submitText}
                onClose={onClose}
              />
            </WizardProvider>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

