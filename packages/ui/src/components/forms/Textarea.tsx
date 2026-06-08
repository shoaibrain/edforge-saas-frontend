import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing } from '../../utils'
import { useFieldContext } from './Field'

const textareaVariants = cva(
  cn(
    'block w-full border bg-[rgb(var(--background-secondary))] shadow-sm',
    'text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
    'transition-colors duration-fast ease-standard',
    'hover:bg-[rgb(var(--background-tertiary))]',
    'disabled:cursor-not-allowed disabled:opacity-60 read-only:cursor-default',
    'focus:border-[rgb(var(--border-focus))]',
    focusRing
  ),
  {
    variants: {
      size: {
        sm: 'min-h-20 rounded-lg px-3 py-2 text-sm',
        md: 'min-h-24 rounded-lg px-3 py-2.5 text-sm',
        lg: 'min-h-32 rounded-xl px-4 py-3 text-base',
      },
      invalid: {
        true: 'border-[rgb(var(--state-danger-border))]',
        false: 'border-[rgb(var(--border-primary))]',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      size: 'md',
      invalid: false,
      resize: 'vertical',
    },
  }
)

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  showCharacterCount?: boolean
}

function initialLength(value: unknown): number {
  return typeof value === 'string' || typeof value === 'number' ? String(value).length : 0
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size,
      invalid,
      disabled,
      readOnly,
      id,
      value,
      defaultValue,
      maxLength,
      showCharacterCount = false,
      onChange,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      resize,
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
    const generatedId = useId()
    const showCount = Boolean(showCharacterCount && maxLength)
    const countId = showCount ? `${resolvedId ?? `textarea-${generatedId}`}-count` : undefined
    const describedBy =
      [ariaDescribedBy, field?.describedBy, countId].filter(Boolean).join(' ') || undefined
    const [uncontrolledLength, setUncontrolledLength] = useState(initialLength(defaultValue))
    const characterCount = value !== undefined ? initialLength(value) : uncontrolledLength

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      setUncontrolledLength(event.currentTarget.value.length)
      onChange?.(event)
    }

    return (
      <div className="relative">
        <textarea
          ref={ref}
          id={resolvedId}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          disabled={resolvedDisabled}
          readOnly={resolvedReadOnly}
          aria-invalid={ariaInvalid ?? (resolvedInvalid ? true : undefined)}
          aria-describedby={describedBy}
          onChange={handleChange}
          className={cn(
            textareaVariants({
              size: resolvedSize,
              invalid: resolvedInvalid,
              resize,
            }),
            showCharacterCount && maxLength && 'pb-8',
            className
          )}
          data-invalid={resolvedInvalid || undefined}
          data-disabled={resolvedDisabled || undefined}
          data-readonly={resolvedReadOnly || undefined}
          {...props}
        />
        {showCount ? (
          <span
            id={countId}
            aria-live="polite"
            className="absolute bottom-2 right-3 text-xs text-[rgb(var(--text-tertiary))]"
          >
            {characterCount}/{maxLength}
          </span>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { textareaVariants }
