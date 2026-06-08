import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '../../utils'

type FieldDensity = 'default' | 'compact' | 'inline'

export interface FieldContextValue {
  controlId: string
  labelId?: string
  describedBy?: string
  invalid?: boolean
  disabled?: boolean
  readOnly?: boolean
  density: FieldDensity
}

const FieldContext = createContext<FieldContextValue | null>(null)

export function useFieldContext() {
  return useContext(FieldContext)
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode
  helperText?: ReactNode
  error?: ReactNode
  required?: boolean
  optionalText?: ReactNode
  lockedReason?: ReactNode
  disabled?: boolean
  readOnly?: boolean
  controlId?: string
  density?: FieldDensity
  children: ReactNode
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      required = false,
      optionalText = 'optional',
      lockedReason,
      disabled = false,
      readOnly = false,
      controlId,
      density = 'default',
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const resolvedControlId = controlId ?? `field-${generatedId}`
    const helperId = helperText ? `${resolvedControlId}-helper` : undefined
    const errorId = error ? `${resolvedControlId}-error` : undefined
    const lockId = lockedReason ? `${resolvedControlId}-locked` : undefined
    const labelId = label ? `${resolvedControlId}-label` : undefined
    const describedBy = [errorId, !error ? helperId : undefined, lockId].filter(Boolean).join(' ') || undefined
    const isInvalid = Boolean(error)

    return (
      <FieldContext.Provider
        value={{
          controlId: resolvedControlId,
          labelId,
          describedBy,
          invalid: isInvalid,
          disabled,
          readOnly,
          density,
        }}
      >
        <div
          ref={ref}
          className={cn(
            density === 'inline'
              ? 'grid gap-2 sm:grid-cols-[minmax(8rem,14rem)_1fr]'
              : density === 'compact'
                ? 'space-y-1'
                : 'space-y-1.5',
            disabled && 'opacity-60',
            className
          )}
          data-invalid={isInvalid || undefined}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          {...props}
        >
          {label ? (
            <div className={cn(density === 'inline' && 'pt-2')}>
              <label
                id={labelId}
                htmlFor={resolvedControlId}
                className="block text-sm font-medium text-[rgb(var(--text-secondary))]"
              >
                {label}
                {required ? (
                  <span className="ml-1 text-[rgb(var(--state-danger-fg))]" aria-hidden="true">
                    *
                  </span>
                ) : optionalText ? (
                  <span className="ml-1 text-xs font-normal text-[rgb(var(--text-tertiary))]">
                    ({optionalText})
                  </span>
                ) : null}
              </label>
              {lockedReason ? (
                <p id={lockId} className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                  {lockedReason}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className={cn(density === 'inline' && 'min-w-0')}>
            {children}
            {error ? (
              <p
                id={errorId}
                role="alert"
                className="mt-1.5 text-xs font-medium text-[rgb(var(--state-danger-fg))]"
              >
                {error}
              </p>
            ) : helperText ? (
              <p id={helperId} className="mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                {helperText}
              </p>
            ) : null}
          </div>
        </div>
      </FieldContext.Provider>
    )
  }
)

Field.displayName = 'Field'

export { Field as FormField }
