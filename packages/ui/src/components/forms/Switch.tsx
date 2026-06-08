import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn, focusRing } from '../../utils'
import { Field, useFieldContext, type FieldProps } from './Field'

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
  },
} satisfies Record<NonNullable<SwitchProps['size']>, { track: string; thumb: string; translate: string }>

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked = false,
      onChange,
      disabled,
      label,
      description,
      size = 'md',
      id,
      ...props
    },
    ref
  ) => {
    const field = useFieldContext()
    const sizes = sizeClasses[size]
    const generatedId = useId()
    const resolvedId = id ?? field?.controlId ?? `switch-${generatedId}`
    const resolvedDisabled = disabled ?? field?.disabled ?? false
    // A <label htmlFor> does not name a <button>, so name the switch via
    // aria-labelledby: its own visible label when present, otherwise the
    // surrounding Field's label.
    const ownLabelId = label ? `${resolvedId}-label` : undefined
    const descriptionId = description ? `${resolvedId}-description` : undefined
    const labelledBy = ownLabelId ?? field?.labelId
    const describedBy =
      [descriptionId, field?.describedBy].filter(Boolean).join(' ') || undefined

    return (
      <span className={cn('flex items-start gap-3', className)}>
        <button
          ref={ref}
          id={resolvedId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          disabled={resolvedDisabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            'relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors duration-fast ease-standard',
            checked ? 'bg-[rgb(var(--action-primary-bg))]' : 'bg-[rgb(var(--background-tertiary))]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            focusRing,
            sizes.track
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block rounded-full bg-[rgb(var(--background-secondary))] shadow-raised transition-transform duration-fast ease-standard',
              sizes.thumb,
              checked ? sizes.translate : 'translate-x-0'
            )}
          />
        </button>
        {label || description ? (
          <span className="min-w-0 flex-1">
            {label ? (
              <span id={ownLabelId} className="block text-sm font-medium text-[rgb(var(--text-primary))]">
                {label}
              </span>
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

Switch.displayName = 'Switch'

export interface SwitchFieldProps extends Omit<FieldProps, 'children'> {
  switchProps: SwitchProps
}

export const SwitchField = forwardRef<HTMLButtonElement, SwitchFieldProps>(
  ({ switchProps, ...fieldProps }, ref) => (
    <Field {...fieldProps}>
      <Switch ref={ref} {...switchProps} />
    </Field>
  )
)

SwitchField.displayName = 'SwitchField'
