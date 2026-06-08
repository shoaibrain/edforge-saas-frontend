import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing } from '../../utils'
import { Field, useFieldContext, type FieldProps } from './Field'

const checkboxBoxVariants = cva(
  cn(
    'relative inline-flex shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-fast ease-standard',
    'disabled:cursor-not-allowed disabled:opacity-60',
    focusRing
  ),
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      checked: {
        true: 'border-[rgb(var(--action-primary-bg))] bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]',
        false: 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-transparent hover:border-[rgb(var(--border-focus))]',
      },
      invalid: {
        true: 'border-[rgb(var(--state-danger-border))]',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      checked: false,
      invalid: false,
    },
  }
)

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'checked'>,
    VariantProps<typeof checkboxBoxVariants> {
  label?: ReactNode
  description?: ReactNode
  indeterminate?: boolean
  checked?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size,
      checked,
      defaultChecked,
      disabled,
      invalid,
      id,
      label,
      description,
      indeterminate = false,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const field = useFieldContext()
    const generatedId = useId()
    const resolvedId = id ?? field?.controlId ?? `checkbox-${generatedId}`
    const descriptionId = description ? `${resolvedId}-description` : undefined
    const resolvedDisabled = disabled ?? field?.disabled ?? false
    const resolvedInvalid = invalid ?? field?.invalid ?? false
    const resolvedChecked = Boolean(checked ?? defaultChecked)
    const describedBy = [ariaDescribedBy, field?.describedBy, descriptionId].filter(Boolean).join(' ') || undefined
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'

    return (
      <span className={cn('flex items-start gap-3', className)}>
        <span className="relative mt-0.5 inline-flex">
          <input
            ref={ref}
            id={resolvedId}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={resolvedDisabled}
            aria-invalid={ariaInvalid ?? (resolvedInvalid ? true : undefined)}
            aria-describedby={describedBy}
            aria-checked={indeterminate ? 'mixed' : undefined}
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              checkboxBoxVariants({
                size,
                checked: resolvedChecked || indeterminate,
                invalid: resolvedInvalid,
              }),
              'peer-checked:border-[rgb(var(--action-primary-bg))] peer-checked:bg-[rgb(var(--action-primary-bg))] peer-checked:text-[rgb(var(--action-primary-fg))]',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--border-focus))] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[rgb(var(--background-primary))]'
            )}
          >
            {indeterminate ? <Minus className={iconSize} /> : <Check className={iconSize} />}
          </span>
        </span>
        {label || description ? (
          <span className="min-w-0 flex-1">
            {label ? (
              <label htmlFor={resolvedId} className="block cursor-pointer text-sm font-medium text-[rgb(var(--text-primary))]">
                {label}
              </label>
            ) : null}
            {description ? (
              <span id={descriptionId} className="mt-0.5 block text-sm text-[rgb(var(--text-tertiary))]">
                {description}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export interface CheckboxFieldProps extends Omit<FieldProps, 'children'> {
  checkboxProps?: CheckboxProps
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ checkboxProps, ...fieldProps }, ref) => (
    <Field {...fieldProps}>
      <Checkbox ref={ref} {...checkboxProps} />
    </Field>
  )
)

CheckboxField.displayName = 'CheckboxField'

export { checkboxBoxVariants }
