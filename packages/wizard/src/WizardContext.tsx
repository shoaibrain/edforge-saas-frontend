/**
 * Wizard Context
 * 
 * Provides shared state and actions for multi-step wizard forms.
 * Supports step navigation, validation, and data persistence.
 */

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ZodError } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

import type {
  WizardStepStatus,
  WizardContextValue,
  WizardProviderProps,
} from './types'

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

export const useWizardContext = useWizard

// ============================================================================
// PROVIDER
// ============================================================================

// WizardProviderProps imported from ./types

export function WizardProvider({
  steps,
  initialData = {},
  onSubmit,
  autoSaveKey,
  children,
}: WizardProviderProps) {
  // Restore from auto-save on initial mount
  const [currentStep, setCurrentStep] = useState(() => {
    if (!autoSaveKey) return 0
    try {
      const saved = localStorage.getItem(autoSaveKey)
      if (saved) return JSON.parse(saved).step ?? 0
    } catch { /* ignore */ }
    return 0
  })
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (!autoSaveKey) return initialData
    try {
      const saved = localStorage.getItem(autoSaveKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...initialData, ...parsed.data }
      }
    } catch { /* ignore */ }
    return initialData
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // Auto-save to localStorage when formData or currentStep changes
  const autoSaveRef = useRef(autoSaveKey)
  autoSaveRef.current = autoSaveKey
  useEffect(() => {
    if (!autoSaveRef.current) return
    try {
      localStorage.setItem(autoSaveRef.current, JSON.stringify({ step: currentStep, data: formData }))
    } catch { /* ignore quota errors */ }
  }, [formData, currentStep])

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
      setCurrentStep((prev: number) => prev + 1)
      setErrors({})
    }

    return true
  }, [currentStep, steps.length, validateStep])

  // Go to previous step
  const goToBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev: number) => prev - 1)
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

  // Update form data (deep merge for nested objects to prevent data loss)
  const updateData = useCallback((data: Record<string, unknown>) => {
    setFormData((prev) => {
      const merged = { ...prev }
      for (const key of Object.keys(data)) {
        const incoming = data[key]
        const existing = prev[key]
        // Deep merge plain objects (not arrays, dates, or null)
        if (
          incoming != null &&
          existing != null &&
          typeof incoming === 'object' &&
          typeof existing === 'object' &&
          !Array.isArray(incoming) &&
          !Array.isArray(existing) &&
          !(incoming instanceof Date) &&
          !(existing instanceof Date)
        ) {
          merged[key] = {
            ...(existing as Record<string, unknown>),
            ...(incoming as Record<string, unknown>),
          }
        } else {
          merged[key] = incoming
        }
      }
      return merged
    })
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
      // Clear auto-save on successful submit
      if (autoSaveKey) {
        try { localStorage.removeItem(autoSaveKey) } catch { /* ignore */ }
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [steps.length, validateStep, onSubmit, formData, autoSaveKey])

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
    // Clear auto-save
    if (autoSaveKey) {
      try { localStorage.removeItem(autoSaveKey) } catch { /* ignore */ }
    }
  }, [initialData, autoSaveKey])

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
      visibleSteps: steps,
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

