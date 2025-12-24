/**
 * Wizard Container Component
 * 
 * Full-page wizard layout with progress indicator, step content, and navigation.
 */

import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WizardProvider, useWizardContext } from './WizardContext'
import { WizardProgress, WizardProgressCompact } from './WizardProgress'
import { WizardNavigation, WizardFooter } from './WizardNavigation'
import { cn } from './utils'
import type { WizardContainerProps } from './types'

// ============================================================================
// STEP CONTAINER WITH ANIMATIONS
// ============================================================================

function WizardStepContainer() {
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

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  }

  return (
    <AnimatePresence mode="wait" custom={1}>
      <motion.div
        key={currentStep}
        custom={1}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
// WIZARD CONTENT - Internal component that uses context
// ============================================================================

interface WizardContentProps {
  header?: React.ReactNode
  footerVariant?: 'inline' | 'fixed'
  contentClassName?: string
  submitText?: string
  showMobileProgress?: boolean
}

function WizardContent({
  header,
  footerVariant = 'inline',
  contentClassName,
  submitText = 'Submit',
  showMobileProgress = true,
}: WizardContentProps) {
  const { currentStepData, currentStep } = useWizardContext()

  return (
    <div className="min-h-screen bg-[rgb(var(--surface-primary))]">
      {/* Header */}
      {header}

      {/* Progress */}
      <div className="py-8 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-secondary))]">
        {/* Desktop Progress */}
        <div className="hidden md:block">
          <WizardProgress />
        </div>
        
        {/* Mobile Progress */}
        {showMobileProgress && (
          <div className="md:hidden">
            <WizardProgressCompact />
          </div>
        )}
      </div>

      {/* Step Header */}
      <motion.div
        key={`header-${currentStep}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-6 py-8"
      >
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          {currentStepData.title}
        </h1>
        {currentStepData.description && (
          <p className="mt-2 text-[rgb(var(--text-secondary))]">
            {currentStepData.description}
          </p>
        )}
      </motion.div>

      {/* Step Content */}
      <div className={cn('max-w-3xl mx-auto px-6 pb-32', contentClassName)}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            </div>
          }
        >
          <WizardStepContainer />
        </Suspense>
        
        {/* Inline Navigation */}
        {footerVariant === 'inline' && (
          <WizardNavigation submitText={submitText} className="mt-8" />
        )}
      </div>

      {/* Fixed Footer Navigation */}
      {footerVariant === 'fixed' && (
        <WizardFooter submitText={submitText} fixed />
      )}
    </div>
  )
}

// ============================================================================
// MAIN WIZARD CONTAINER
// ============================================================================

export function WizardContainer({
  steps,
  initialData,
  onSubmit,
  onCancel,
  header,
  footerVariant = 'inline',
  contentClassName,
  submitText = 'Submit',
  showMobileProgress = true,
}: WizardContainerProps) {
  return (
    <WizardProvider
      steps={steps}
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <WizardContent
        header={header}
        footerVariant={footerVariant}
        contentClassName={contentClassName}
        submitText={submitText}
        showMobileProgress={showMobileProgress}
      />
    </WizardProvider>
  )
}

