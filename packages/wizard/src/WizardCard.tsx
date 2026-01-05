/**
 * Wizard Card Component
 * 
 * Embedded card-style wizard for inline creation flows.
 */

import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WizardProvider, useWizardContext } from './WizardContext'
import { WizardProgressCompact } from './WizardProgress'
import { WizardNavigation } from './WizardNavigation'
import { cn } from './utils'
import type { WizardCardProps } from './types'

// ============================================================================
// STEP CONTAINER
// ============================================================================

function CardStepContainer() {
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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
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
// CARD CONTENT
// ============================================================================

interface CardContentProps {
  title?: string
  description?: string
  submitText?: string
}

function CardContent({
  title,
  description,
  submitText = 'Submit',
}: CardContentProps) {
  return (
    <>
      {/* Header */}
      {(title || description) && (
        <div className="px-6 py-5 border-b border-[rgb(var(--border-secondary))]">
          {title && (
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-[rgb(var(--text-tertiary))]">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="px-6 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
        <WizardProgressCompact />
      </div>

      {/* Content */}
      <div className="p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
          }
        >
          <CardStepContainer />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-[rgb(var(--surface-tertiary))] border-t border-[rgb(var(--border-secondary))]">
        <WizardNavigation submitText={submitText} />
      </div>
    </>
  )
}

// ============================================================================
// MAIN WIZARD CARD
// ============================================================================

export function WizardCard({
  steps,
  initialData,
  onSubmit,
  onCancel,
  title,
  description,
  submitText = 'Submit',
  className,
}: WizardCardProps) {
  return (
    <WizardProvider
      steps={steps}
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <div
        className={cn(
          'bg-[rgb(var(--surface-secondary))] rounded-2xl border border-[rgb(var(--border-primary))] shadow-lg overflow-hidden',
          className
        )}
      >
        <CardContent
          title={title}
          description={description}
          submitText={submitText}
        />
      </div>
    </WizardProvider>
  )
}

