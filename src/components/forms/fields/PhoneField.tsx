/**
 * PhoneField Component
 * 
 * A composable phone input field with country code support.
 * Integrates with react-hook-form with animated states.
 */

import { useState } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { useSpring, animated, config } from '@react-spring/web'
import { Phone, AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
]

export interface PhoneFieldProps {
  name: string
  label?: string
  placeholder?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  className?: string
  rules?: RegisterOptions
  showCountryCode?: boolean
  defaultCountryCode?: string
}

export function PhoneField({
  name,
  label,
  placeholder = '(555) 123-4567',
  helperText,
  disabled = false,
  required = false,
  className,
  rules,
  showCountryCode = true,
  defaultCountryCode = '+1',
}: PhoneFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [countryCode, setCountryCode] = useState(defaultCountryCode)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = name.split('.').reduce((acc: any, part) => acc?.[part], errors)
  const errorMessage = error?.message as string | undefined
  const hasError = !!errorMessage

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode)

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

  const dropdownSpring = useSpring({
    opacity: showCountryDropdown ? 1 : 0,
    transform: showCountryDropdown ? 'translateY(0px)' : 'translateY(-8px)',
    config: config.gentle,
  })

  const { onBlur, ...registerProps } = register(name, rules)

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  return (
    <div className={cn('space-y-1.5 relative', className)}>
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
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Country Code Selector */}
        {showCountryCode && (
          <button
            type="button"
            onClick={() => !disabled && setShowCountryDropdown(!showCountryDropdown)}
            className={cn(
              'flex items-center gap-1 pl-3 pr-2 py-2.5 border-r border-[rgb(var(--border-primary))]',
              'text-sm text-[rgb(var(--text-primary))]',
              'hover:bg-[rgb(var(--interactive-hover))] transition-colors',
              disabled && 'pointer-events-none'
            )}
          >
            <span>{selectedCountry?.flag}</span>
            <span className="text-[rgb(var(--text-secondary))]">{countryCode}</span>
            <ChevronDown className="w-3 h-3 text-[rgb(var(--text-tertiary))]" />
          </button>
        )}

        {/* Phone Icon (when no country code) */}
        {!showCountryCode && (
          <div className="pl-3 flex items-center text-[rgb(var(--text-tertiary))]">
            <Phone className="w-4 h-4" />
          </div>
        )}

        {/* Input */}
        <input
          {...registerProps}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur(e)
          }}
          id={name}
          type="tel"
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value)
            e.target.value = formatted
            registerProps.onChange(e)
          }}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          className={cn(
            'flex-1 w-full px-3 py-2.5 text-sm bg-transparent',
            'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
            'focus:outline-none',
            'disabled:cursor-not-allowed'
          )}
        />

        {/* Error Icon */}
        {hasError && (
          <div className="pr-3">
            <AlertCircle className="w-4 h-4 text-rust-500" />
          </div>
        )}
      </animated.div>

      {/* Country Code Dropdown */}
      {showCountryDropdown && (
        <animated.div
          style={dropdownSpring}
          className={cn(
            'absolute z-50 left-0 mt-1 py-1 rounded-xl border',
            'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))]',
            'shadow-xl shadow-black/10 dark:shadow-black/30',
            'max-h-48 overflow-auto scrollbar-thin'
          )}
        >
          {COUNTRY_CODES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                setCountryCode(country.code)
                setShowCountryDropdown(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                'transition-colors duration-150',
                country.code === countryCode
                  ? 'bg-teal-500/10 text-teal-700 dark:text-cyan-300'
                  : 'text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))]'
              )}
            >
              <span>{country.flag}</span>
              <span className="flex-1">{country.country}</span>
              <span className="text-[rgb(var(--text-tertiary))]">{country.code}</span>
            </button>
          ))}
        </animated.div>
      )}

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

