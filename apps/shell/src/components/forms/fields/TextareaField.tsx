/**
 * TextareaField Component
 * 
 * A composable textarea field that integrates with react-hook-form.
 * Features animated focus states, character count, and accessibility.
 */

import { useState } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface TextareaFieldProps {
  name: string
  label?: string
  placeholder?: string
  icon?: LucideIcon
  helperText?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  className?: string
  rules?: RegisterOptions
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

export function TextareaField({
  name,
  label,
  placeholder,
  icon: Icon,
  helperText,
  disabled = false,
  readOnly = false,
  required = false,
  className,
  rules,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  resize = 'vertical',
}: TextareaFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = name.split('.').reduce((acc: any, part) => acc?.[part], errors)
  const errorMessage = error?.message as string | undefined
  const hasError = !!errorMessage

  const { onBlur, onChange, ...registerProps } = register(name, rules)

  const resizeClass = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  }[resize]

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium transition-colors duration-200',
            hasError 
              ? 'text-rust-500' 
              : isFocused 
                ? 'text-[rgb(var(--action-secondary-fg))]' 
                : 'text-[rgb(var(--text-secondary))]'
          )}
        >
          {label}
          {required && <span className="text-rust-500 ms-0.5">*</span>}
        </label>
      )}

      {/* Textarea Container */}
      <div
        className={cn(
          'relative rounded-xl border bg-[rgb(var(--background-secondary))] transition-all duration-200 overflow-hidden',
          hasError 
            ? 'border-rust-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : isFocused 
              ? 'border-[rgb(var(--border-focus))] shadow-[0_0_0_3px_rgba(20,184,166,0.15)]'
              : 'border-[rgb(var(--border-primary))]',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Icon */}
        {Icon && (
          <div className="absolute top-3 left-3 text-[rgb(var(--text-tertiary))]">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Textarea */}
        <textarea
          {...registerProps}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur(e)
          }}
          onChange={(e) => {
            setCharCount(e.target.value.length)
            onChange(e)
          }}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          rows={rows}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          className={cn(
            'w-full px-3 py-2.5 text-sm bg-transparent',
            'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
            'focus:outline-none',
            'disabled:cursor-not-allowed',
            resizeClass,
            Icon && 'ps-10'
          )}
        />

        {/* Character Count */}
        {showCharacterCount && maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-[rgb(var(--text-tertiary))]">
            {charCount} / {maxLength}
          </div>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute top-3 right-3">
            <AlertCircle className="w-4 h-4 text-rust-500" />
          </div>
        )}
      </div>

      {/* Helper Text or Error */}
      <div className="min-h-[1.25rem]">
        {hasError ? (
          <p id={`${name}-error`} className="text-xs text-rust-500" role="alert">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p id={`${name}-helper`} className="text-xs text-[rgb(var(--text-tertiary))]">
            {helperText}
          </p>
        ) : null}
      </div>
    </div>
  )
}

