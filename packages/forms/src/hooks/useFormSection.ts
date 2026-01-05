/**
 * useFormSection Hook
 * 
 * A custom hook for managing form section visibility and validation.
 */

import { useState, useCallback, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { type ZodSchema } from 'zod'

export interface UseFormSectionOptions {
  /** Section ID */
  id: string
  /** Fields in this section (for validation) */
  fields: string[]
  /** Optional Zod schema for section validation */
  schema?: ZodSchema
  /** Whether section is initially expanded */
  defaultExpanded?: boolean
  /** Whether section is collapsible */
  collapsible?: boolean
}

export interface UseFormSectionReturn {
  /** Section ID */
  id: string
  /** Whether section is expanded */
  isExpanded: boolean
  /** Toggle section expansion */
  toggle: () => void
  /** Expand section */
  expand: () => void
  /** Collapse section */
  collapse: () => void
  /** Whether section has any errors */
  hasErrors: boolean
  /** Whether all section fields are valid */
  isValid: boolean
  /** Whether any section field is dirty */
  isDirty: boolean
  /** Count of errors in section */
  errorCount: number
  /** Validate section fields */
  validate: () => Promise<boolean>
}

/**
 * Hook to manage form section state
 * 
 * @param options - Section configuration
 * @returns Section state and utilities
 */
export function useFormSection({
  id,
  fields,
  schema,
  defaultExpanded = true,
  collapsible = true,
}: UseFormSectionOptions): UseFormSectionReturn {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const {
    trigger,
    getValues,
    formState: { errors, dirtyFields },
  } = useFormContext()

  // Calculate section error state
  const sectionErrors = useMemo(() => {
    return fields.reduce((acc, field) => {
      const fieldParts = field.split('.')
      let error: any = errors
      for (const part of fieldParts) {
        error = error?.[part]
        if (!error) break
      }
      if (error?.message) {
        acc.push(error.message)
      }
      return acc
    }, [] as string[])
  }, [fields, errors])

  const hasErrors = sectionErrors.length > 0
  const errorCount = sectionErrors.length
  const isValid = !hasErrors

  // Calculate dirty state
  const isDirty = useMemo(() => {
    return fields.some((field) => {
      const fieldParts = field.split('.')
      let dirty: any = dirtyFields
      for (const part of fieldParts) {
        dirty = dirty?.[part]
        if (!dirty) return false
      }
      return !!dirty
    })
  }, [fields, dirtyFields])

  // Toggle expansion
  const toggle = useCallback(() => {
    if (collapsible) {
      setIsExpanded((prev) => !prev)
    }
  }, [collapsible])

  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    if (collapsible) {
      setIsExpanded(false)
    }
  }, [collapsible])

  // Validate section
  const validate = useCallback(async (): Promise<boolean> => {
    // If schema provided, validate against it
    if (schema) {
      const values = getValues()
      try {
        await schema.parseAsync(values)
        return true
      } catch {
        return false
      }
    }

    // Otherwise, trigger validation on section fields
    const result = await trigger(fields)
    return result
  }, [schema, getValues, trigger, fields])

  return {
    id,
    isExpanded,
    toggle,
    expand,
    collapse,
    hasErrors,
    isValid,
    isDirty,
    errorCount,
    validate,
  }
}

