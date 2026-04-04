/**
 * CollapsibleSection — V2 Expandable Form Section
 *
 * Wraps a group of form fields in a collapsible card with:
 * - Icon + title + description header
 * - Expand/collapse toggle with smooth animation
 * - Field completion indicator (e.g. "3 of 5 filled")
 * - Auto-expand when validation errors appear
 *
 * Must be rendered inside a <FormProvider> context.
 */

import { type ReactNode, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useFormSection } from '@edforge/forms'

// ============================================================================
// TYPES
// ============================================================================

interface CollapsibleSectionProps {
  /** Unique section identifier */
  id: string
  /** Section title */
  title: string
  /** Optional description below title */
  description?: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Field names for completion tracking and error detection */
  fields: string[]
  /** Whether section starts expanded (default: true) */
  defaultExpanded?: boolean
  /** Form field content */
  children: ReactNode
}

// ============================================================================
// HELPERS
// ============================================================================

/** Traverse a dot-notation path in a nested object */
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, part) =>
      acc != null && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[part]
        : undefined,
    obj,
  )
}

/** Count how many fields have non-empty values */
function countFilledFields(
  values: Record<string, unknown>,
  fields: string[],
): { filled: number; total: number } {
  let filled = 0
  for (const field of fields) {
    const val = getNestedValue(values, field)
    if (val === undefined || val === null || val === '') continue
    if (Array.isArray(val) && val.length === 0) continue
    if (typeof val === 'boolean') {
      // Booleans are always "filled" — they have a value
      filled++
      continue
    }
    filled++
  }
  return { filled, total: fields.length }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CollapsibleSection({
  id,
  title,
  description,
  icon: Icon,
  fields,
  defaultExpanded = true,
  children,
}: CollapsibleSectionProps) {
  const { getValues } = useFormContext()
  const contentId = `section-content-${id}`

  const {
    isExpanded,
    toggle,
    expand,
    hasErrors,
    errorCount,
  } = useFormSection({
    id,
    fields,
    defaultExpanded,
    collapsible: true,
  })

  // Auto-expand when errors appear in a collapsed section
  useEffect(() => {
    if (hasErrors && !isExpanded) {
      expand()
    }
  }, [hasErrors, isExpanded, expand])

  // Completion count
  const { filled, total } = useMemo(() => {
    const values = getValues()
    return countFilledFields(values, fields)
  }, [getValues, fields, isExpanded]) // recalc on toggle to refresh display

  const isComplete = filled === total && total > 0

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--v2-border-default)',
        background: isExpanded ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
        overflow: 'hidden',
      }}
    >
      {/* Header — clickable toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="w-full flex items-center gap-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]"
        style={{ padding: '14px 16px' }}
      >
        {/* Icon pill */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: hasErrors
              ? 'var(--v2-danger-bg)'
              : 'rgba(29, 158, 117, 0.08)',
          }}
        >
          <Icon
            className="w-3.5 h-3.5"
            style={{
              color: hasErrors ? 'var(--v2-danger)' : '#1D9E75',
            }}
          />
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <span
            className="block font-semibold"
            style={{
              fontSize: 13,
              color: 'var(--v2-text-primary)',
              letterSpacing: '-0.2px',
            }}
          >
            {title}
          </span>
          {description && (
            <span
              className="block"
              style={{ fontSize: 11, color: 'var(--v2-text-muted)', marginTop: 1 }}
            >
              {description}
            </span>
          )}
        </div>

        {/* Completion badge (shown when collapsed or has status) */}
        <div className="flex items-center gap-2 shrink-0">
          {hasErrors ? (
            <span
              className="flex items-center gap-1"
              style={{ fontSize: 10, fontWeight: 500, color: 'var(--v2-danger)' }}
            >
              <AlertCircle className="w-3 h-3" />
              {errorCount} {errorCount === 1 ? 'error' : 'errors'}
            </span>
          ) : !isExpanded ? (
            isComplete ? (
              <span
                className="flex items-center gap-1"
                style={{ fontSize: 10, fontWeight: 500, color: '#1D9E75' }}
              >
                <Check className="w-3 h-3" />
                Complete
              </span>
            ) : filled > 0 ? (
              <span
                style={{ fontSize: 10, fontWeight: 500, color: 'var(--v2-text-hint)' }}
              >
                {filled} of {total} filled
              </span>
            ) : (
              <span
                style={{ fontSize: 10, color: 'var(--v2-text-ghost)' }}
              >
                {total} fields
              </span>
            )
          ) : null}

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              className="w-4 h-4"
              style={{ color: 'var(--v2-text-hint)' }}
            />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 16px 16px',
                borderTop: '1px solid var(--v2-border-default)',
                paddingTop: 16,
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
