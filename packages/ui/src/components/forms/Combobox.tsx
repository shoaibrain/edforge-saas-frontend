import { Fragment, forwardRef, useMemo, useState } from 'react'
import {
  Combobox as HeadlessCombobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from '@headlessui/react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing, focusRingInset } from '../../utils'
import { Field, useFieldContext, type FieldProps } from './Field'
import type { SelectOption } from './Select'

const comboboxShellVariants = cva(
  cn(
    'relative flex w-full items-center border bg-[rgb(var(--background-secondary))]',
    'text-[rgb(var(--text-primary))] shadow-sm transition-colors duration-fast ease-standard',
    'hover:bg-[rgb(var(--background-tertiary))]',
    'focus-within:ring-2 focus-within:ring-[rgb(var(--border-focus))] focus-within:ring-offset-2 focus-within:ring-offset-[rgb(var(--background-primary))]',
    focusRing
  ),
  {
    variants: {
      size: {
        sm: 'min-h-8 rounded-lg text-sm',
        md: 'min-h-10 rounded-lg text-sm',
        lg: 'min-h-12 rounded-xl text-base',
      },
      invalid: {
        true: 'border-[rgb(var(--state-danger-border))]',
        false: 'border-[rgb(var(--border-primary))] focus-within:border-[rgb(var(--border-focus))]',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
    },
  }
)

const comboboxInputVariants = cva(
  'min-w-0 flex-1 bg-transparent outline-none text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'px-2 py-1.5 text-sm',
        md: 'px-2 py-2.5 text-sm',
        lg: 'px-3 py-3 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

export interface ComboboxProps
  extends Omit<FieldProps, 'children' | 'controlId' | 'onChange'>,
    VariantProps<typeof comboboxShellVariants> {
  options: readonly SelectOption[]
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  clearable?: boolean
  loading?: boolean
  emptyMessage?: string
  inputClassName?: string
  optionsClassName?: string
  filterOption?: (option: SelectOption, query: string) => boolean
}

interface ComboboxControlProps
  extends Pick<
      ComboboxProps,
      | 'options'
      | 'value'
      | 'onChange'
      | 'placeholder'
      | 'clearable'
      | 'loading'
      | 'emptyMessage'
      | 'inputClassName'
      | 'optionsClassName'
      | 'filterOption'
    >,
    VariantProps<typeof comboboxShellVariants> {
  disabled?: boolean
  invalid?: boolean | null
}

const defaultFilter = (option: SelectOption, query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalized)
}

const ComboboxControl = forwardRef<HTMLInputElement, ComboboxControlProps>(
  (
    {
      options,
      value = null,
      onChange,
      placeholder = 'Search options',
      clearable = false,
      loading = false,
      emptyMessage = 'No options match that search.',
      disabled,
      invalid,
      size,
      inputClassName,
      optionsClassName,
      filterOption = defaultFilter,
    },
    ref
  ) => {
    const field = useFieldContext()
    const [query, setQuery] = useState('')
    const selectedOption = options.find((option) => option.value === value) ?? null
    const resolvedDisabled = disabled ?? field?.disabled ?? false
    const resolvedInvalid = invalid ?? field?.invalid ?? false
    const resolvedSize = size ?? (field?.density === 'compact' ? 'sm' : 'md')
    const filteredOptions = useMemo(
      () => options.filter((option) => filterOption(option, query)),
      [filterOption, options, query]
    )

    return (
      <HeadlessCombobox
        value={selectedOption}
        onChange={(option: SelectOption | null) => {
          onChange(option?.value ?? null)
          setQuery('')
        }}
        disabled={resolvedDisabled}
        immediate
      >
        <div className="relative">
          <div
            className={cn(
              comboboxShellVariants({
                size: resolvedSize,
                invalid: resolvedInvalid,
              }),
              resolvedDisabled && 'cursor-not-allowed opacity-60 hover:bg-[rgb(var(--background-secondary))]'
            )}
            data-invalid={resolvedInvalid || undefined}
            data-disabled={resolvedDisabled || undefined}
          >
            <Search className="ml-3 h-4 w-4 shrink-0 text-[rgb(var(--text-tertiary))]" aria-hidden="true" />
            <ComboboxInput
              ref={ref}
              id={field?.controlId}
              aria-invalid={resolvedInvalid ? true : undefined}
              aria-busy={loading || undefined}
              aria-describedby={field?.describedBy}
              displayValue={(option: SelectOption | null) => option?.label ?? ''}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={loading ? 'Loading…' : placeholder}
              className={cn(comboboxInputVariants({ size: resolvedSize }), inputClassName)}
            />
            {clearable && selectedOption && !resolvedDisabled ? (
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setQuery('')
                }}
                className={cn(
                  'mr-1 rounded p-1 text-[rgb(var(--text-tertiary))]',
                  'hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
                  focusRingInset
                )}
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <ComboboxButton
              className={cn(
                'mr-2 rounded p-1 text-[rgb(var(--text-tertiary))]',
                'hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
                focusRingInset
              )}
              aria-label="Show options"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </ComboboxButton>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-enter duration-fast"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-exit duration-instant"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            afterLeave={() => setQuery('')}
          >
            <ComboboxOptions
              className={cn(
                'absolute z-50 mt-1 max-h-64 min-w-full w-max max-w-sm overflow-auto rounded-xl border border-[rgb(var(--border-primary))]',
                'bg-[rgb(var(--background-elevated))] p-1 shadow-popover focus:outline-none',
                optionsClassName
              )}
            >
              {loading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="px-3 py-2 text-sm text-[rgb(var(--text-tertiary))]"
                >
                  Loading options…
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[rgb(var(--text-tertiary))]">{emptyMessage}</div>
              ) : (
                filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.value}
                    value={option}
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
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </HeadlessCombobox>
    )
  }
)

ComboboxControl.displayName = 'ComboboxControl'

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
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
          density={density}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        >
          <ComboboxControl ref={ref} disabled={disabled} invalid={Boolean(error)} {...props} />
        </Field>
      )
    }

    return <ComboboxControl ref={ref} disabled={disabled} invalid={Boolean(error)} {...props} />
  }
)

Combobox.displayName = 'Combobox'

export { ComboboxControl, comboboxInputVariants, comboboxShellVariants }
