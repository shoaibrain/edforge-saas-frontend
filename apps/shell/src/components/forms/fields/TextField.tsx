/**
 * TextField Component
 * 
 * A composable text input field that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef, useState, type ReactNode } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, type LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface TextFieldProps {
  name: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'url' | 'tel'
  icon?: LucideIcon
  helperText?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  autoComplete?: string
  className?: string
  inputClassName?: string
  rules?: RegisterOptions
  showSuccessState?: boolean
  suffix?: ReactNode
  prefix?: ReactNode
  maxLength?: number
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      name,
      label,
      placeholder,
      type = 'text',
      icon: Icon,
      helperText,
      disabled = false,
      readOnly = false,
      required = false,
      autoComplete,
      className,
      inputClassName,
      rules,
      showSuccessState = false,
      suffix,
      prefix,
      maxLength,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const {
      register,
      formState: { errors, touchedFields, dirtyFields },
    } = useFormContext()

    // Get nested error (supports "address.city" style paths)
    const error = name.split('.').reduce((acc: any, part) => acc?.[part], errors)
    const isTouched = name.split('.').reduce((acc: any, part) => acc?.[part], touchedFields)
    const isDirty = name.split('.').reduce((acc: any, part) => acc?.[part], dirtyFields)
    const errorMessage = error?.message as string | undefined
    const hasError = !!errorMessage
    const isValid = showSuccessState && isDirty && isTouched && !hasError

    const { ref: registerRef, ...registerProps } = register(name, rules)

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
            disabled && 'opacity-60 cursor-not-allowed',
            inputClassName
          )}
        >
          {/* Prefix / Icon */}
          {(Icon || prefix) && (
            <div className="pl-3 flex items-center text-[rgb(var(--text-tertiary))]">
              {Icon && <Icon className="w-4 h-4" />}
              {prefix}
            </div>
          )}

          {/* Input */}
          <input
            {...registerProps}
            ref={(e) => {
              registerRef(e)
              if (ref) {
                if (typeof ref === 'function') ref(e)
                else ref.current = e
              }
            }}
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoComplete={autoComplete}
            maxLength={maxLength}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false)
              registerProps.onBlur(e)
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            className={cn(
              'flex-1 w-full px-3 py-2.5 text-sm bg-transparent',
              'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              Icon || prefix ? 'pl-2' : 'pl-3',
              suffix || isValid || hasError ? 'pr-2' : 'pr-3'
            )}
          />

          {/* Suffix / Status Icons */}
          <div className="pr-3 flex items-center gap-2">
            {suffix}
            {isValid && (
              <Check className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />
            )}
            {hasError && (
              <AlertCircle className="w-4 h-4 text-rust-500" />
            )}
          </div>
        </div>

        {/* Helper Text or Error */}
        <div className="min-h-[1.25rem]">
          <AnimatePresence mode="wait">
            {hasError ? (
              <motion.p
                key="error"
                id={`${name}-error`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-rust-500 flex items-center gap-1"
                role="alert"
              >
                {errorMessage}
              </motion.p>
            ) : helperText ? (
              <p id={`${name}-helper`} className="text-xs text-[rgb(var(--text-tertiary))]">
                {helperText}
              </p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    )
  }
)

TextField.displayName = 'TextField'

