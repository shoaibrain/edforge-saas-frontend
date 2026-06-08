import { Fragment, forwardRef, type ReactNode } from 'react'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing, focusRingInset } from '../../utils'
import { Field, useFieldContext, type FieldProps } from './Field'

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
  icon?: ReactNode
}

const selectButtonVariants = cva(
  cn(
    'flex w-full items-center justify-between border bg-[rgb(var(--background-secondary))]',
    'text-left text-[rgb(var(--text-primary))] shadow-sm transition-colors duration-fast ease-standard',
    'hover:bg-[rgb(var(--background-tertiary))] disabled:cursor-not-allowed disabled:opacity-60',
    focusRing
  ),
  {
    variants: {
      size: {
        sm: 'min-h-8 rounded-lg px-3 py-1.5 text-sm',
        md: 'min-h-10 rounded-lg px-3 py-2.5 text-sm',
        lg: 'min-h-12 rounded-xl px-4 py-3 text-base',
      },
      invalid: {
        true: 'border-[rgb(var(--state-danger-border))]',
        false: 'border-[rgb(var(--border-primary))] data-[open]:border-[rgb(var(--border-focus))]',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
)

export interface SelectProps
  extends Omit<FieldProps, 'children' | 'controlId' | 'onChange'>,
    VariantProps<typeof selectButtonVariants> {
  controlId?: string
  options: readonly SelectOption[]
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  clearable?: boolean
  loading?: boolean
  emptyMessage?: string
  buttonClassName?: string
  optionsClassName?: string
}

interface SelectControlProps
  extends Pick<
      SelectProps,
      | 'options'
      | 'value'
      | 'onChange'
      | 'placeholder'
      | 'clearable'
      | 'loading'
      | 'emptyMessage'
      | 'buttonClassName'
      | 'optionsClassName'
    >,
    VariantProps<typeof selectButtonVariants> {
  disabled?: boolean
  invalid?: boolean | null
}

const SelectControl = forwardRef<HTMLButtonElement, SelectControlProps>(
  (
    {
      options,
      value = null,
      onChange,
      placeholder = 'Select an option',
      clearable = false,
      loading = false,
      emptyMessage = 'No options available.',
      disabled,
      invalid,
      size,
      buttonClassName,
      optionsClassName,
    },
    ref
  ) => {
    const field = useFieldContext()
    const selectedOption = options.find((option) => option.value === value)
    const resolvedDisabled = disabled ?? field?.disabled ?? false
    const resolvedInvalid = invalid ?? field?.invalid ?? false
    const resolvedSize = size ?? (field?.density === 'compact' ? 'sm' : 'md')

    return (
      <Listbox value={value ?? null} onChange={onChange} disabled={resolvedDisabled}>
        <div className="relative">
          <ListboxButton
            ref={ref}
            id={field?.controlId}
            aria-invalid={resolvedInvalid ? true : undefined}
            aria-describedby={field?.describedBy}
            className={cn(
              selectButtonVariants({
                size: resolvedSize,
                invalid: resolvedInvalid,
              }),
              buttonClassName
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              {selectedOption?.icon ? (
                <span className="shrink-0 text-[rgb(var(--text-tertiary))]">{selectedOption.icon}</span>
              ) : null}
              <span
                className={cn(
                  'truncate',
                  selectedOption ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-tertiary))]'
                )}
              >
                {loading ? 'Loading…' : selectedOption?.label ?? placeholder}
              </span>
            </span>
            <span className="ml-2 flex shrink-0 items-center gap-1 text-[rgb(var(--text-tertiary))]">
              {clearable && selectedOption && !resolvedDisabled ? (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label="Clear selection"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onChange(null)
                  }}
                  className="rounded p-0.5 hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            enter="transition ease-enter duration-fast"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-exit duration-instant"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <ListboxOptions
              className={cn(
                'absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[rgb(var(--border-primary))]',
                'bg-[rgb(var(--background-elevated))] p-1 shadow-popover focus:outline-none',
                optionsClassName
              )}
            >
              {loading ? (
                <div className="px-3 py-2 text-sm text-[rgb(var(--text-tertiary))]">Loading options…</div>
              ) : options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[rgb(var(--text-tertiary))]">{emptyMessage}</div>
              ) : (
                options.map((option) => (
                  <ListboxOption
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'group flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-sm',
                      'text-[rgb(var(--text-primary))] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                      'data-[focus]:bg-[rgb(var(--background-tertiary))]',
                      'data-[selected]:text-[rgb(var(--action-secondary-fg))]',
                      focusRingInset
                    )}
                  >
                    {option.icon ? (
                      <span className="mt-0.5 shrink-0 text-[rgb(var(--text-tertiary))]">{option.icon}</span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block text-xs text-[rgb(var(--text-tertiary))]">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 opacity-0 group-data-[selected]:opacity-100"
                      aria-hidden="true"
                    />
                  </ListboxOption>
                ))
              )}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    )
  }
)

SelectControl.displayName = 'SelectControl'

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      optionalText,
      lockedReason,
      density,
      disabled,
      readOnly,
      className,
      controlId,
      ...props
    },
    ref
  ) => {
    if (label || helperText || error || lockedReason) {
      return (
        <Field
          label={label}
          helperText={helperText}
          error={error}
          required={required}
          optionalText={optionalText}
          lockedReason={lockedReason}
          controlId={controlId}
          density={density}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        >
          <SelectControl ref={ref} disabled={disabled} invalid={Boolean(error)} {...props} />
        </Field>
      )
    }

    return (
      <SelectControl
        ref={ref}
        disabled={disabled}
        invalid={Boolean(error)}
        {...props}
      />
    )
  }
)

Select.displayName = 'Select'

export { SelectControl, selectButtonVariants }
