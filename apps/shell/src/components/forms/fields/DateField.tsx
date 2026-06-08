/**
 * DateField Component
 * 
 * A composable date input field that integrates with react-hook-form.
 * Features animated focus states, date formatting, and accessibility.
 */

import { useState } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { Calendar, AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface DateFieldProps {
  name: string
  label?: string
  placeholder?: string
  icon?: LucideIcon
  helperText?: string
  disabled?: boolean
  required?: boolean
  className?: string
  rules?: RegisterOptions
  min?: string
  max?: string
}

export function DateField({
  name,
  label,
  placeholder = 'Select a date',
  icon: Icon = Calendar,
  helperText,
  disabled = false,
  required = false,
  className,
  rules,
  min,
  max,
}: DateFieldProps) {
  const [isFocused, setIsFocused] = useState(false)

  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = name.split('.').reduce((acc: any, part) => acc?.[part], errors)
  const errorMessage = error?.message as string | undefined
  const hasError = !!errorMessage

  const { onBlur, ...registerProps } = register(name, rules)

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
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div
        className={cn(
          'relative flex items-center rounded-xl border bg-[rgb(var(--background-secondary))] transition-all duration-200',
          hasError 
            ? 'border-rust-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : isFocused 
              ? 'border-[rgb(var(--border-focus))] shadow-[0_0_0_3px_rgba(20,184,166,0.15)]'
              : 'border-[rgb(var(--border-primary))]',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Icon */}
        <div className="pl-3 flex items-center text-[rgb(var(--text-tertiary))]">
          <Icon className="w-4 h-4" />
        </div>

        {/* Date Input */}
        <input
          {...registerProps}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur(e)
          }}
          id={name}
          type="date"
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          onFocus={() => setIsFocused(true)}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          className={cn(
            'flex-1 w-full pl-2 pr-3 py-2.5 text-sm bg-transparent',
            'text-[rgb(var(--text-primary))]',
            'focus:outline-none',
            'disabled:cursor-not-allowed',
            '[&::-webkit-calendar-picker-indicator]:opacity-60',
            '[&::-webkit-calendar-picker-indicator]:hover:opacity-100',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
          )}
        />

        {/* Error Icon */}
        {hasError && (
          <div className="pr-3">
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

