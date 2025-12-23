/**
 * Wizard Context
 * 
 * Provides shared state and actions for multi-step wizard forms.
 * Supports step navigation, validation, and data persistence.
 */

import React, { createContext, useContext, useCallback, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ZodError, type ZodSchema } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export interface WizardStep {
  /** Unique step identifier */
  id: string
  /** Display title */
  title: string
  /** Optional description */
  description?: string
  /** Step icon */
  icon: LucideIcon
  /** Zod validation schema for this step */
  schema?: ZodSchema
  /** Whether step is optional */
  isOptional?: boolean
  /** Step component */
  component: React.ComponentType<WizardStepProps>
}

export interface WizardStepProps {
  /** Current step data */
  data: Record<string, unknown>
  /** Update step data */
  updateData: (data: Record<string, unknown>) => void
  /** Navigate to next step */
  onNext: () => void
  /** Navigate to previous step */
  onBack: () => void
  /** Whether this is the first step */
  isFirst: boolean
  /** Whether this is the last step */
  isLast: boolean
  /** Validation errors for current step */
  errors: Record<string, string>
  /** Clear specific error */
  clearError: (field: string) => void
}

export type WizardStepStatus = 'pending' | 'current' | 'completed' | 'error'

export interface WizardContextValue {
  /** All wizard steps */
  steps: WizardStep[]
  /** Current step index */
  currentStep: number
  /** Current step data */
  currentStepData: WizardStep
  /** All collected form data */
  formData: Record<string, unknown>
  /** Step validation errors */
  errors: Record<string, string>
  /** Whether wizard is submitting */
  isSubmitting: boolean
  /** Steps completion status */
  completedSteps: Set<number>
  
  // Actions
  /** Go to next step */
  goToNext: () => Promise<boolean>
  /** Go to previous step */
  goToBack: () => void
  /** Go to specific step */
  goToStep: (index: number) => void
  /** Update form data for current step */
  updateData: (data: Record<string, unknown>) => void
  /** Submit the wizard */
  submit: () => Promise<void>
  /** Set validation errors */
  setErrors: (errors: Record<string, string>) => void
  /** Clear specific error */
  clearError: (field: string) => void
  /** Reset wizard to initial state */
  reset: () => void
  /** Get step status */
  getStepStatus: (index: number) => WizardStepStatus
  /** Check if can go to step */
  canGoToStep: (index: number) => boolean
}

// ============================================================================
// CONTEXT
// ============================================================================

const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

export interface WizardProviderProps {
  /** Wizard step configurations */
  steps: WizardStep[]
  /** Initial form data */
  initialData?: Record<string, unknown>
  /** Called when wizard is submitted */
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  /** Called when wizard is cancelled */
  onCancel?: () => void
  /** Children */
  children: React.ReactNode
}

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

  const currentStepData = steps[currentStep]

  // Validate current step data
  const validateStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex]
    if (!step.schema) return true

    try {
      await step.schema.parseAsync(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error
        const newErrors: Record<string, string> = {}
        zodError.issues.forEach((issue) => {
          const path = issue.path.join('.')
          newErrors[path] = issue.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }, [steps, formData])

  // Go to next step
  const goToNext = useCallback(async (): Promise<boolean> => {
    const isValid = await validateStep(currentStep)
    if (!isValid) return false

    setCompletedSteps((prev) => new Set([...prev, currentStep]))

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setErrors({})
    }

    return true
  }, [currentStep, steps.length, validateStep])

  // Go to previous step
  const goToBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setErrors({})
    }
  }, [currentStep])

  // Go to specific step
  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index)
      setErrors({})
    }
  }, [steps.length])

  // Update form data
  const updateData = useCallback((data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }, [])

  // Submit wizard
  const submit = useCallback(async () => {
    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
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
  }, [steps.length, validateStep, onSubmit, formData])

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

