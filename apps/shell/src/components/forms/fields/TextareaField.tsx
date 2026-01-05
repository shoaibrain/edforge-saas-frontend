/**
 * TextareaField Component
 * 
 * A composable textarea field that integrates with react-hook-form.
 * Features animated focus states, character count, and accessibility.
 */

import { useState } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { useSpring, animated, config } from '@react-spring/web'
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

  // Animation springs
  const focusSpring = useSpring({
    borderColor: hasError 
      ? 'rgb(239, 68, 68)' 
      : isFocused 
        ? 'rgb(20, 184, 166)' 
        : 'rgb(var(--border-primary))',
    boxShadow: isFocused && !hasError
      ? '0 0 0 3px rgba(20, 184, 166, 0.15)'
      : hasError
        ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
        : '0 0 0 0px transparent',
    config: config.gentle,
  })

  const labelSpring = useSpring({
    color: hasError 
      ? 'rgb(239, 68, 68)' 
      : isFocused 
        ? 'rgb(20, 184, 166)' 
        : 'rgb(var(--text-secondary))',
    config: config.gentle,
  })

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
        <animated.label
          htmlFor={name}
          style={labelSpring}
          className="block text-sm font-medium"
        >
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </animated.label>
      )}

      {/* Textarea Container */}
      <animated.div
        style={{
          borderColor: focusSpring.borderColor,
          boxShadow: focusSpring.boxShadow,
        }}
        className={cn(
          'relative rounded-xl border bg-[rgb(var(--surface-secondary))] transition-colors overflow-hidden',
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
            Icon && 'pl-10'
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
      </animated.div>

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

