import { forwardRef, useId, type ReactNode } from 'react'
import { cn } from '../../utils'
import { Select, type SelectOption } from './Select'

/**
 * GradeRangeField — a composed "from / to" range built from two Select
 * controls under a single shared label + error region. Each inner Select is
 * label-less and named via aria-label, so the group reads as one field rather
 * than two unrelated dropdowns. No Field wrapper is used (the two controls
 * would otherwise collide on a single generated id).
 */
export interface GradeRangeFieldProps {
  label?: ReactNode
  options: readonly SelectOption[]
  fromValue: string | null
  toValue: string | null
  onFromChange: (value: string | null) => void
  onToChange: (value: string | null) => void
  fromAccessibleLabel?: string
  toAccessibleLabel?: string
  fromPlaceholder?: string
  toPlaceholder?: string
  required?: boolean
  helperText?: ReactNode
  error?: ReactNode
  disabled?: boolean
  className?: string
}

export const GradeRangeField = forwardRef<HTMLDivElement, GradeRangeFieldProps>(
  (
    {
      label,
      options,
      fromValue,
      toValue,
      onFromChange,
      onToChange,
      fromAccessibleLabel = 'From grade',
      toAccessibleLabel = 'To grade',
      fromPlaceholder = 'From',
      toPlaceholder = 'To',
      required = false,
      helperText,
      error,
      disabled = false,
      className,
    },
    ref
  ) => {
    const id = useId()
    const labelId = label ? `${id}-label` : undefined
    const errorId = error ? `${id}-error` : undefined
    const helperId = helperText ? `${id}-helper` : undefined
    const invalid = Boolean(error)

    return (
      <div ref={ref} className={cn('space-y-1.5', disabled && 'opacity-60', className)}>
        {label ? (
          <span id={labelId} className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
            {label}
            {required ? (
              <span className="ml-1 text-[rgb(var(--state-danger-fg))]" aria-hidden="true">
                *
              </span>
            ) : null}
          </span>
        ) : null}
        <div
          role="group"
          aria-labelledby={labelId}
          aria-describedby={errorId ?? helperId}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
        >
          <Select
            aria-label={fromAccessibleLabel}
            options={options}
            value={fromValue}
            onChange={onFromChange}
            placeholder={fromPlaceholder}
            disabled={disabled}
            invalid={invalid}
          />
          <span aria-hidden="true" className="text-[rgb(var(--text-tertiary))]">
            –
          </span>
          <Select
            aria-label={toAccessibleLabel}
            options={options}
            value={toValue}
            onChange={onToChange}
            placeholder={toPlaceholder}
            disabled={disabled}
            invalid={invalid}
          />
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-xs font-medium text-[rgb(var(--state-danger-fg))]">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[rgb(var(--text-tertiary))]">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

GradeRangeField.displayName = 'GradeRangeField'
