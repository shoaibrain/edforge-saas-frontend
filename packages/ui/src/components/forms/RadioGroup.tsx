import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'
import { Field, type FieldProps } from './Field'

export interface RadioOption {
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: readonly RadioOption[]
  value?: string
  onChange: (value: string) => void
  name?: string
  disabled?: boolean
  invalid?: boolean
  direction?: 'vertical' | 'horizontal'
  variant?: 'default' | 'card'
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      options,
      value,
      onChange,
      name,
      disabled = false,
      invalid = false,
      direction = 'vertical',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    // Native radios must share a `name` to be a single keyboard-navigable
    // group with DOM-level mutual exclusion. Fall back to a stable generated
    // name when the consumer doesn't supply one.
    const generatedName = useId()
    const resolvedName = name ?? generatedName

    return (
    <div
      ref={ref}
      role="radiogroup"
      aria-invalid={invalid || undefined}
      className={cn(
        direction === 'vertical' ? 'flex flex-col gap-3' : 'flex flex-wrap gap-3',
        className
      )}
      {...props}
    >
      {options.map((option) => {
        const selected = value === option.value
        const optionDisabled = disabled || option.disabled

        return (
          <label
            key={option.value}
            className={cn(
              'group flex cursor-pointer items-start gap-3 text-start transition-colors duration-fast ease-standard',
              optionDisabled && 'cursor-not-allowed opacity-60',
              variant === 'card' &&
                cn(
                  'rounded-xl border px-4 py-3',
                  selected
                    ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--state-info-bg)/0.22)]'
                    : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--background-tertiary))]'
                )
            )}
          >
            <span className="relative mt-0.5 inline-flex">
              <input
                type="radio"
                name={resolvedName}
                value={option.value}
                checked={selected}
                disabled={optionDisabled}
                onChange={() => !optionDisabled && onChange(option.value)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border-2 bg-[rgb(var(--background-secondary))] transition-colors',
                  selected ? 'border-[rgb(var(--action-primary-bg))]' : 'border-[rgb(var(--border-primary))]',
                  invalid && 'border-[rgb(var(--state-danger-border))]',
                  'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--border-focus))] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[rgb(var(--background-primary))]'
                )}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full bg-[rgb(var(--action-primary-bg))] transition-transform',
                    selected ? 'scale-100' : 'scale-0'
                  )}
                />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[rgb(var(--text-primary))]">
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-sm text-[rgb(var(--text-tertiary))]">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export interface RadioGroupFieldProps extends Omit<FieldProps, 'children'> {
  radioGroupProps: RadioGroupProps
}

export const RadioGroupField = forwardRef<HTMLDivElement, RadioGroupFieldProps>(
  ({ radioGroupProps, ...fieldProps }, ref) => (
    <Field {...fieldProps}>
      <RadioGroup ref={ref} {...radioGroupProps} />
    </Field>
  )
)

RadioGroupField.displayName = 'RadioGroupField'
