/**
 * TextField Component
 * 
 * A composable text input field that integrates with react-hook-form.
 * Features animated focus states, error handling, and accessibility.
 */

import { forwardRef, useState, type ReactNode } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { useSpring, animated, config } from '@react-spring/web'
import { AlertCircle, Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

    const errorSpring = useSpring({
      opacity: hasError ? 1 : 0,
      y: hasError ? 0 : -4,
      config: config.gentle,
    })

    const { ref: registerRef, ...registerProps } = register(name, rules)

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

        {/* Input Container */}
        <animated.div
          style={{
            borderColor: focusSpring.borderColor,
            boxShadow: focusSpring.boxShadow,
          }}
          className={cn(
            'relative flex items-center rounded-xl border bg-[rgb(var(--surface-secondary))] transition-colors',
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
              <Check className="w-4 h-4 text-teal-500" />
            )}
            {hasError && (
              <AlertCircle className="w-4 h-4 text-rust-500" />
            )}
          </div>
        </animated.div>

        {/* Helper Text or Error */}
        <div className="min-h-[1.25rem]">
          {hasError ? (
            <animated.p
              id={`${name}-error`}
              style={{
                opacity: errorSpring.opacity,
                transform: errorSpring.y.to((y) => `translateY(${y}px)`),
              }}
              className="text-xs text-rust-500 flex items-center gap-1"
              role="alert"
            >
              {errorMessage}
            </animated.p>
          ) : helperText ? (
            <p id={`${name}-helper`} className="text-xs text-[rgb(var(--text-tertiary))]">
              {helperText}
            </p>
          ) : null}
        </div>
      </div>
    )
  }
)

TextField.displayName = 'TextField'

