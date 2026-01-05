/**
 * useWizardStep Hook
 * 
 * Utilities for step components.
 */

import { useCallback, useMemo } from 'react'
import { useWizardContext } from '../WizardContext'

export interface UseWizardStepReturn {
  /** Current step index */
  stepIndex: number
  /** Total number of steps */
  totalSteps: number
  /** Whether this is the first step */
  isFirst: boolean
  /** Whether this is the last step */
  isLast: boolean
  /** Current step data */
  stepData: ReturnType<typeof useWizardContext>['currentStepData']
  /** Form data */
  formData: Record<string, unknown>
  /** Validation errors */
  errors: Record<string, string>
  /** Update form data */
  updateField: (field: string, value: unknown) => void
  /** Update multiple fields */
  updateFields: (data: Record<string, unknown>) => void
  /** Clear error for field */
  clearError: (field: string) => void
  /** Navigate to next step */
  next: () => Promise<boolean>
  /** Navigate to previous step */
  back: () => void
  /** Whether wizard is submitting */
  isSubmitting: boolean
}

/**
 * Hook with step-level utilities
 */
export function useWizardStep(): UseWizardStepReturn {
  const {
    currentStep,
    visibleSteps,
    currentStepData,
    formData,
    errors,
    updateData,
    clearError,
    goToNext,
    goToBack,
    isSubmitting,
  } = useWizardContext()

  const stepIndex = currentStep
  const totalSteps = visibleSteps.length
  const isFirst = currentStep === 0
  const isLast = currentStep === visibleSteps.length - 1

  // Update single field
  const updateField = useCallback(
    (field: string, value: unknown) => {
      updateData({ [field]: value })
    },
    [updateData]
  )

  // Update multiple fields
  const updateFields = useCallback(
    (data: Record<string, unknown>) => {
      updateData(data)
    },
    [updateData]
  )

  return useMemo(
    () => ({
      stepIndex,
      totalSteps,
      isFirst,
      isLast,
      stepData: currentStepData,
      formData,
      errors,
      updateField,
      updateFields,
      clearError,
      next: goToNext,
      back: goToBack,
      isSubmitting,
    }),
    [
      stepIndex,
      totalSteps,
      isFirst,
      isLast,
      currentStepData,
      formData,
      errors,
      updateField,
      updateFields,
      clearError,
      goToNext,
      goToBack,
      isSubmitting,
    ]
  )
}

