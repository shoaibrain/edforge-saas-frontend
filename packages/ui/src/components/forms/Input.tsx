import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing } from '../../utils'
import { useFieldContext } from './Field'

const inputShellVariants = cva(
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
      readOnly: {
        true: 'bg-[rgb(var(--background-tertiary))]',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      readOnly: false,
    },
  }
)

const inputElementVariants = cva(
  cn(
    'min-w-0 flex-1 bg-transparent outline-none',
    'text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
    'disabled:cursor-not-allowed read-only:cursor-default'
  ),
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-3 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
      },
      hasPrefix: {
        true: 'pl-2',
        false: '',
      },
      hasSuffix: {
        true: 'pr-2',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      hasPrefix: false,
      hasSuffix: false,
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'readOnly'>,
    VariantProps<typeof inputShellVariants> {
  prefix?: ReactNode
  suffix?: ReactNode
  isLoading?: boolean
  isSuccess?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      invalid,
      readOnly,
      disabled,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      prefix,
      suffix,
      isLoading = false,
      isSuccess = false,
      ...props
    },
    ref
  ) => {
    const field = useFieldContext()
    const resolvedId = id ?? field?.controlId
    const resolvedInvalid = invalid ?? field?.invalid ?? false
    const resolvedDisabled = disabled ?? field?.disabled ?? false
    const resolvedReadOnly = readOnly ?? field?.readOnly ?? false
    const resolvedSize = size ?? (field?.density === 'compact' ? 'sm' : 'md')
    const describedBy = [ariaDescribedBy, field?.describedBy].filter(Boolean).join(' ') || undefined

    return (
      <div
        className={cn(
          inputShellVariants({
            size: resolvedSize,
            invalid: resolvedInvalid,
            readOnly: resolvedReadOnly,
          }),
          resolvedDisabled && 'cursor-not-allowed opacity-60 hover:bg-[rgb(var(--background-secondary))]',
          className
        )}
        data-invalid={resolvedInvalid || undefined}
        data-disabled={resolvedDisabled || undefined}
        data-readonly={resolvedReadOnly || undefined}
      >
        {prefix ? (
          <span className="flex shrink-0 items-center pl-3 text-[rgb(var(--text-tertiary))]">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={resolvedId}
          disabled={resolvedDisabled}
          readOnly={resolvedReadOnly}
          aria-invalid={ariaInvalid ?? (resolvedInvalid ? true : undefined)}
          aria-busy={isLoading || undefined}
          aria-describedby={describedBy}
          className={cn(
            inputElementVariants({
              size: resolvedSize,
              hasPrefix: Boolean(prefix),
              hasSuffix: Boolean(suffix || isLoading || isSuccess),
            })
          )}
          {...props}
        />
        {isLoading ? (
          <span
            className="mr-3 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[rgb(var(--border-secondary))] border-t-[rgb(var(--border-focus))]"
            aria-hidden="true"
          />
        ) : isSuccess ? (
          <span
            className="mr-3 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
              <path
                d="M3.5 8.2 6.4 11 12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : suffix ? (
          <span className="flex shrink-0 items-center pr-3 text-[rgb(var(--text-tertiary))]">
            {suffix}
          </span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { inputShellVariants, inputElementVariants }
