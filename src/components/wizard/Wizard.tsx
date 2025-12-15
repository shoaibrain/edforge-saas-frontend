/**
 * Wizard Container Component
 * 
 * Main container for multi-step wizard forms.
 * Combines progress indicator, step content, and navigation.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WizardProvider, useWizard, type WizardProviderProps } from './WizardContext'
import { WizardProgress, WizardProgressCompact } from './WizardProgress'
import { WizardNavigation, WizardFooter } from './WizardNavigation'
import { cn } from '@/lib/utils'

// ============================================================================
// STEP CONTAINER WITH ANIMATIONS
// ============================================================================

function WizardStepContainer() {
  const { currentStep, currentStepData, formData, updateData, goToNext, goToBack, errors, clearError, steps } = useWizard()
  
  const StepComponent = currentStepData.component
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

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
  /** Header component to render above wizard */
  header?: React.ReactNode
  /** Footer variant */
  footerVariant?: 'inline' | 'fixed'
  /** Custom class name for content area */
  contentClassName?: string
  /** Submit button text */
  submitText?: string
  /** Show mobile progress variant */
  showMobileProgress?: boolean
}

function WizardContent({
  header,
  footerVariant = 'inline',
  contentClassName,
  submitText = 'Submit',
  showMobileProgress = true,
}: WizardContentProps) {
  const { currentStepData, currentStep } = useWizard()

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
        <WizardStepContainer />
        
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
// MAIN WIZARD COMPONENT
// ============================================================================

export interface WizardProps extends Omit<WizardProviderProps, 'children'> {
  /** Header component to render above wizard */
  header?: React.ReactNode
  /** Footer variant */
  footerVariant?: 'inline' | 'fixed'
  /** Custom class name for content area */
  contentClassName?: string
  /** Submit button text */
  submitText?: string
  /** Show mobile progress variant */
  showMobileProgress?: boolean
}

export function Wizard({
  steps,
  initialData,
  onSubmit,
  onCancel,
  header,
  footerVariant = 'inline',
  contentClassName,
  submitText = 'Submit',
  showMobileProgress = true,
}: WizardProps) {
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

// ============================================================================
// WIZARD CARD VARIANT - For embedding in pages
// ============================================================================

export interface WizardCardProps extends Omit<WizardProviderProps, 'children'> {
  /** Card title */
  title?: string
  /** Card description */
  description?: string
  /** Submit button text */
  submitText?: string
  /** Additional class name */
  className?: string
}

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
        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-5 border-b border-[rgb(var(--border-secondary))]">
            {title && (
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="px-6 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
          <WizardProgressCompact />
        </div>

        {/* Content */}
        <div className="p-6">
          <WizardStepContainer />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[rgb(var(--surface-tertiary))] border-t border-[rgb(var(--border-secondary))]">
          <WizardNavigation submitText={submitText} />
        </div>
      </div>
    </WizardProvider>
  )
}

