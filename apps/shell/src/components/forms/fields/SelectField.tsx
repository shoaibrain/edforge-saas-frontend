/**
 * SelectField Component
 * 
 * A composable select dropdown that integrates with react-hook-form.
 * Features animated focus states, search functionality, and accessibility.
 */

import { useState, useRef, useEffect } from 'react'
import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
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

  const handleSelect = (optionValue: string) => {
    setValue(name, optionValue, { shouldValidate: true, shouldDirty: true })
    setIsOpen(false)
  }

  // Register the field for validation
  register(name, rules)

  return (
    <div className={cn('space-y-1.5 relative', className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium transition-colors duration-200',
            hasError 
              ? 'text-rust-500' 
              : isOpen 
                ? 'text-[rgb(var(--action-secondary-fg))]' 
                : 'text-[rgb(var(--text-secondary))]'
          )}
        >
          {label}
          {required && <span className="text-rust-500 ms-0.5">*</span>}
        </label>
      )}

      {/* Select Trigger */}
      <button
        type="button"
        id={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className={cn(
          'relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border',
          'bg-[rgb(var(--background-secondary))] text-start transition-all duration-200',
          'focus:outline-none',
          hasError 
            ? 'border-rust-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : (isOpen || isFocused) 
              ? 'border-[rgb(var(--border-focus))] shadow-[0_0_0_3px_rgba(20,184,166,0.15)]'
              : 'border-[rgb(var(--border-primary))]',
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
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-1 py-1 rounded-xl border',
              'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary))]',
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
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-start',
                    'transition-colors duration-150',
                    isSelected 
                      ? 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ' 
                      : 'text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))]',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  {OptionIcon && <OptionIcon className="w-4 h-4" />}
                  <span className="flex-1">{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

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

