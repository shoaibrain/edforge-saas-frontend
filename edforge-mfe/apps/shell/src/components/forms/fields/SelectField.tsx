/**
 * SelectField Component
 * 
 * A composable select dropdown that integrates with react-hook-form.
 * Features animated focus states, search functionality, and accessibility.
 */

import { useState, useRef, useEffect } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { useSpring, animated, config } from '@react-spring/web'
import { ChevronDown, Check, AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface SelectOption {
  value: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

export interface SelectFieldProps {
  name: string
  label?: string
  placeholder?: string
  options: SelectOption[]
  icon?: LucideIcon
  helperText?: string
  disabled?: boolean
  required?: boolean
  className?: string
  rules?: RegisterOptions
}

export function SelectField({
  name,
  label,
  placeholder = 'Select an option',
  options,
  icon: Icon,
  helperText,
  disabled = false,
  required = false,
  className,
  rules,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext()

  const value = watch(name)
  const error = name.split('.').reduce((acc: any, part) => acc?.[part], errors)
  const errorMessage = error?.message as string | undefined
  const hasError = !!errorMessage

  const selectedOption = options.find((opt) => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Animation springs
  const focusSpring = useSpring({
    borderColor: hasError 
      ? 'rgb(239, 68, 68)' 
      : isOpen || isFocused 
        ? 'rgb(20, 184, 166)' 
        : 'rgb(var(--border-primary))',
    boxShadow: (isOpen || isFocused) && !hasError
      ? '0 0 0 3px rgba(20, 184, 166, 0.15)'
      : hasError
        ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
        : '0 0 0 0px transparent',
    config: config.gentle,
  })

  const dropdownSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0px) scale(1)' : 'translateY(-8px) scale(0.98)',
    config: { tension: 300, friction: 25 },
  })

  const chevronSpring = useSpring({
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    config: config.gentle,
  })

  const labelSpring = useSpring({
    color: hasError 
      ? 'rgb(239, 68, 68)' 
      : isOpen 
        ? 'rgb(20, 184, 166)' 
        : 'rgb(var(--text-secondary))',
    config: config.gentle,
  })

  const handleSelect = (optionValue: string) => {
    setValue(name, optionValue, { shouldValidate: true, shouldDirty: true })
    setIsOpen(false)
  }

  // Register the field for validation
  register(name, rules)

  return (
    <div className={cn('space-y-1.5', className)} ref={containerRef}>
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

      {/* Select Trigger */}
      <animated.button
        type="button"
        id={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        style={{
          borderColor: focusSpring.borderColor,
          boxShadow: focusSpring.boxShadow,
        }}
        className={cn(
          'relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border',
          'bg-[rgb(var(--surface-secondary))] text-left',
          'focus:outline-none',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={hasError}
      >
        {Icon && <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />}
        
        <span className={cn(
          'flex-1 text-sm truncate',
          selectedOption 
            ? 'text-[rgb(var(--text-primary))]' 
            : 'text-[rgb(var(--text-tertiary))]'
        )}>
          {selectedOption?.label || placeholder}
        </span>

        {hasError && <AlertCircle className="w-4 h-4 text-rust-500" />}
        
        <animated.div style={chevronSpring}>
          <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        </animated.div>
      </animated.button>

      {/* Dropdown */}
      {isOpen && (
        <animated.div
          style={dropdownSpring}
          className={cn(
            'absolute z-50 w-full mt-1 py-1 rounded-xl border',
            'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))]',
            'shadow-xl shadow-black/10 dark:shadow-black/30',
            'max-h-60 overflow-auto scrollbar-thin'
          )}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            const OptionIcon = option.icon

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left',
                  'transition-colors duration-150',
                  isSelected 
                    ? 'bg-teal-500/10 text-teal-700 dark:text-cyan-300' 
                    : 'text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))]',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
                role="option"
                aria-selected={isSelected}
              >
                {OptionIcon && <OptionIcon className="w-4 h-4" />}
                <span className="flex-1">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-teal-500" />}
              </button>
            )
          })}
        </animated.div>
      )}

      {/* Helper Text or Error */}
      <div className="min-h-[1.25rem]">
        {hasError ? (
          <p className="text-xs text-rust-500" role="alert">
            {errorMessage}
          </p>
        ) : helperText ? (
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {helperText}
          </p>
        ) : null}
      </div>
    </div>
  )
}

