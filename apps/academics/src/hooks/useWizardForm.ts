/**
 * useWizardForm Hook
 *
 * Bridges the @edforge/wizard data bag with react-hook-form's FormProvider.
 * This allows step components to use @edforge/forms field components
 * (which depend on useFormContext) while keeping the wizard context
 * as the source of truth for data and navigation.
 *
 * P4 / T1.4 — Also registers a "step data provider" with the wizard so
 * `validateStep` / `goToNext` / `submit` can flush live RHF values into
 * `formDataRef` synchronously before Zod parsing. Closes the "Please
 * select an academic year" heisenbug.
 */

import { useEffect, useRef } from 'react'
import { useForm, type UseFormReturn, type FieldValues, type DefaultValues } from 'react-hook-form'
import { useWizard } from '@edforge/wizard'

interface UseWizardFormOptions {
  /** Current wizard form data */
  data: Record<string, unknown>
  /** Wizard's updateData callback */
  updateData: (data: Record<string, unknown>) => void
  /** Wizard validation errors from Zod */
  errors: Record<string, string>
  /** Wizard's clearError callback */
  clearError: (field: string) => void
}

/** Traverse a dot-notation path (e.g. "enrollment.academicYearId") in a nested object */
function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, part) => (acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
    obj,
  )
}

/**
 * Creates a react-hook-form instance synced with the wizard data bag.
 *
 * - Initializes RHF with current wizard data
 * - Watches for field changes and syncs back to wizard
 * - Maps wizard Zod errors to RHF error state
 */
export function useWizardForm({
  data,
  updateData,
  errors,
  clearError,
}: UseWizardFormOptions): UseFormReturn<FieldValues> {
  const isFirstRender = useRef(true)
  const prevValuesRef = useRef<Record<string, unknown>>(data)

  const form = useForm<FieldValues>({
    defaultValues: data as DefaultValues<FieldValues>,
    mode: 'onBlur',
  })

  // P4 / T1.4 — Register a provider so wizard validateStep/goToNext/submit
  // can flush this step's live RHF values synchronously before parsing.
  // The cleanup runs on step navigation (FormProvider unmount), so only
  // ONE provider is registered at a time (the current step's).
  const { registerStepDataProvider } = useWizard()
  useEffect(() => {
    const unregister = registerStepDataProvider(() => form.getValues())
    return unregister
  }, [form, registerStepDataProvider])

  // Sync form changes → wizard data AND clear errors for changed fields.
  //
  // The previous error-clearing approach relied on form.watch's { name } param,
  // which is undefined for register-based fields (SelectField, TextField, etc.).
  // Instead, we compare values at each error path to detect changes.
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }

      const flatValues = values as Record<string, unknown>
      updateData(flatValues)

      // Clear wizard errors for fields whose values changed
      const errorKeys = Object.keys(errors)
      if (errorKeys.length > 0) {
        for (const key of errorKeys) {
          const currentVal = getValueAtPath(flatValues, key)
          const prevVal = getValueAtPath(prevValuesRef.current, key)
          if (currentVal !== prevVal) {
            clearError(key)
          }
        }
      }

      prevValuesRef.current = flatValues
    })
    return () => subscription.unsubscribe()
  }, [form, updateData, errors, clearError])

  // Sync wizard validation errors → RHF errors
  useEffect(() => {
    // Clear all manual errors first
    form.clearErrors()

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        form.setError(field as never, { type: 'manual', message })
      })
    }
  }, [errors, form])

  return form
}
