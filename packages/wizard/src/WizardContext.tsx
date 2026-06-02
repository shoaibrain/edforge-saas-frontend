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
  onValidationError,
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
  const formDataRef = useRef<Record<string, unknown>>(initialData)
  /**
   * P4 / T1.4 — Step data provider.
   * The current step's `FormProvider` (via `useWizardForm`) registers a
   * function that returns `form.getValues()`. `validateStep` /
   * `goToNext` / `submit` call it synchronously at the top to flush
   * live RHF values into `formDataRef` BEFORE Zod parses — closes the
   * race where `form.watch` had queued an updateData but React hadn't
   * yet run the setFormData updater when the user clicked Continue.
   * Only ONE provider is active at a time (the current step's). Step
   * components unmount their FormProvider on navigate, which calls the
   * cleanup returned by `registerStepDataProvider`.
   */
  const stepDataProviderRef = useRef<(() => Record<string, unknown>) | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (!autoSaveKey) {
      formDataRef.current = initialData
      return initialData
    }
    try {
      const saved = localStorage.getItem(autoSaveKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        const restored = { ...initialData, ...parsed.data }
        formDataRef.current = restored
        return restored
      }
    } catch { /* ignore */ }
    formDataRef.current = initialData
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

  // Update form data (deep merge for nested objects to prevent data loss).
  //
  // P4 / T1.3 — Synchronous ref update. Previously the `formDataRef.current
  // = merged` assignment lived INSIDE the `setFormData((prev) => ...)`
  // updater, which React invokes asynchronously. Any synchronous reader of
  // the ref between an `updateData(...)` call and the next React render
  // would see stale data — which is exactly the "Please select an academic
  // year" heisenbug: a SelectField change fires form.watch → updateData
  // (ref-write queued), then the user clicks Continue → validateStep reads
  // the ref synchronously → still empty.
  //
  // Fix: compute `merged` from `formDataRef.current` synchronously, assign
  // the ref synchronously, THEN schedule the React state update. The React
  // semantics for consumers (formData prop, re-render) are unchanged; only
  // the timing of the ref write moves earlier.
  const updateData = useCallback((data: Record<string, unknown>) => {
    const prev = formDataRef.current
    const merged: Record<string, unknown> = { ...prev }
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
    formDataRef.current = merged
    setFormData(merged)
  }, [])

  /**
   * P4 / T1.4 — Register a function that returns the current step's live
   * form values. Called by `useWizardForm` on mount. Returns a cleanup
   * function that unregisters when the FormProvider unmounts (e.g., the
   * step navigates away). Only ONE provider can be active at a time —
   * subsequent registrations replace the previous reference.
   */
  const registerStepDataProvider = useCallback(
    (provider: () => Record<string, unknown>): (() => void) => {
      stepDataProviderRef.current = provider
      return () => {
        if (stepDataProviderRef.current === provider) {
          stepDataProviderRef.current = null
        }
      }
    },
    [],
  )

  /**
   * Internal helper used by validateStep / goToNext / submit. Pulls the
   * current step's live values via the registered provider and merges
   * them into formDataRef SYNCHRONOUSLY before Zod parsing. No-op if no
   * provider is registered (e.g., steps that don't use useWizardForm).
   */
  const flushCurrentStep = useCallback(() => {
    const provider = stepDataProviderRef.current
    if (provider) {
      updateData(provider())
    }
  }, [updateData])

  // Validate current step data.
  //
  // P4 / T1.4 — Flushes the current step's live RHF values into
  // `formDataRef` synchronously BEFORE Zod parses + BEFORE the first
  // `await`. This closes the race where a fast click on Continue right
  // after a SelectField change would see a stale ref (form.watch had
  // queued the updateData but React hadn't run the updater yet).
  // Capturing `snapshot` after the flush, then passing it directly into
  // `parseAsync`, also defends against the parallel case where another
  // updateData call lands DURING the async parse — we validate exactly
  // the state we just flushed, not "whatever the ref happens to hold
  // when await resumes".
  const validateStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex]
    if (!step.schema) return true

    flushCurrentStep()
    const snapshot = formDataRef.current

    try {
      await step.schema.parseAsync(snapshot)
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
        onValidationError?.(newErrors)
      }
      return false
    }
  }, [steps, flushCurrentStep, onValidationError])

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

  // Submit wizard.
  //
  // P4 / T1.4 — Flush the current step's live values FIRST (same race
  // as goToNext / validateStep), then validate all steps. Earlier steps
  // rely on their values already having been merged when the user
  // navigated past them; the current step is the only one with a live
  // provider, so flushing it covers the "type then submit" path.
  const submit = useCallback(async () => {
    flushCurrentStep()
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
      const result = await onSubmit(formDataRef.current)
      // If the handler returned per-field server errors, surface them inline
      // instead of clearing auto-save or treating the submit as successful.
      if (result?.serverErrors && Object.keys(result.serverErrors).length > 0) {
        setErrors(result.serverErrors)
        if (typeof result.targetStepIndex === 'number'
            && result.targetStepIndex >= 0
            && result.targetStepIndex < steps.length) {
          setCurrentStep(result.targetStepIndex)
        }
        return
      }
      // Clear auto-save on successful submit
      if (autoSaveKey) {
        try { localStorage.removeItem(autoSaveKey) } catch { /* ignore */ }
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [steps.length, validateStep, onSubmit, autoSaveKey, flushCurrentStep])

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
    formDataRef.current = initialData
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
      registerStepDataProvider,
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
      registerStepDataProvider,
    ]
  )

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

