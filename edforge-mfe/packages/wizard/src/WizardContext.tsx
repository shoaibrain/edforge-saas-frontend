/**
 * Wizard Context
 * 
 * Provides shared state and actions for multi-step wizard forms.
 * Supports step navigation, validation, and data persistence.
 */

import { createContext, useContext, useCallback, useMemo, useState } from 'react'
import { ZodError } from 'zod'
import type {
  WizardContextValue,
  WizardProviderProps,
  WizardStepStatus,
} from './types'

// ============================================================================
// CONTEXT
// ============================================================================

const WizardContext = createContext<WizardContextValue | null>(null)

/**
 * Hook to access wizard context
 * @throws Error if used outside WizardProvider
 */
export function useWizardContext(): WizardContextValue {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizardContext must be used within a WizardProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

export function WizardProvider({
  steps,
  initialData = {},
  onSubmit,
  children,
}: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Calculate visible steps based on conditions
  const visibleSteps = useMemo(() => {
    return steps.filter((step) => {
      if (!step.condition) return true
      return step.condition(formData)
    })
  }, [steps, formData])

  const currentStepData = visibleSteps[currentStep]

  // Validate current step data
  const validateStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const step = visibleSteps[stepIndex]
    if (!step?.schema) return true

    try {
      await step.schema.parseAsync(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const path = issue.path.join('.')
          newErrors[path] = issue.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }, [visibleSteps, formData])

  // Go to next step
  const goToNext = useCallback(async (): Promise<boolean> => {
    const isValid = await validateStep(currentStep)
    if (!isValid) return false

    setCompletedSteps((prev) => new Set([...prev, currentStep]))

    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setErrors({})
    }

    return true
  }, [currentStep, visibleSteps.length, validateStep])

  // Go to previous step
  const goToBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setErrors({})
    }
  }, [currentStep])

  // Go to specific step
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < visibleSteps.length) {
      setCurrentStep(index)
      setErrors({})
    }
  }, [visibleSteps.length])

  // Update form data
  const updateData = useCallback((data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }, [])

  // Submit wizard
  const submit = useCallback(async () => {
    // Validate all steps
    for (let i = 0; i < visibleSteps.length; i++) {
      const isValid = await validateStep(i)
      if (!isValid) {
        setCurrentStep(i)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }, [visibleSteps.length, validateStep, onSubmit, formData])

  // Clear specific error
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  // Reset wizard
  const reset = useCallback(() => {
    setCurrentStep(0)
    setFormData(initialData)
    setErrors({})
    setCompletedSteps(new Set())
  }, [initialData])

  // Get step status
  const getStepStatus = useCallback((index: number): WizardStepStatus => {
    if (index === currentStep) return 'current'
    if (completedSteps.has(index)) return 'completed'
    if (Object.keys(errors).length > 0 && index === currentStep) return 'error'
    return 'pending'
  }, [currentStep, completedSteps, errors])

  // Check if can go to step
  const canGoToStep = useCallback((index: number): boolean => {
    // Can always go back
    if (index < currentStep) return true
    // Can only go forward if all previous steps are completed
    for (let i = 0; i < index; i++) {
      if (!completedSteps.has(i) && i !== currentStep) return false
    }
    return true
  }, [currentStep, completedSteps])

  const value = useMemo<WizardContextValue>(
    () => ({
      steps,
      visibleSteps,
      currentStep,
      currentStepData,
      formData,
      errors,
      isSubmitting,
      completedSteps,
      goToNext,
      goToBack,
      goToStep,
      updateData,
      submit,
      setErrors,
      clearError,
      reset,
      getStepStatus,
      canGoToStep,
    }),
    [
      steps,
      visibleSteps,
      currentStep,
      currentStepData,
      formData,
      errors,
      isSubmitting,
      completedSteps,
      goToNext,
      goToBack,
      goToStep,
      updateData,
      submit,
      clearError,
      reset,
      getStepStatus,
      canGoToStep,
    ]
  )

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

