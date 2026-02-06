/**
 * TagInput Component
 *
 * Type-to-add tag input with remove capability.
 * Works with the wizard data bag (no react-hook-form dependency).
 */

import { useState, useRef, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'

interface TagInputProps {
  /** Current tags */
  value: string[]
  /** Callback when tags change */
  onChange: (tags: string[]) => void
  /** Label text */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Helper text */
  helperText?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Max number of tags */
  maxTags?: number
  /** Additional class name */
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  label,
  placeholder = 'Type and press Enter to add',
  helperText,
  disabled = false,
  maxTags = 20,
  className = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) return
    if (value.length >= maxTags) return

    onChange([...value, trimmed])
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          {label}
        </label>
      )}

      <div
        className={`
          min-h-[42px] rounded-lg border border-[rgb(var(--border-primary))]
          bg-[rgb(var(--surface-primary))] px-3 py-2
          flex flex-wrap items-center gap-2
          focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence>
          {value.map((tag, index) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-sm font-medium"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTag(index)
                  }}
                  className="p-0.5 rounded hover:bg-teal-100 transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {value.length < maxTags && !disabled && (
          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
            <Plus className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => addTag(inputValue)}
              placeholder={value.length === 0 ? placeholder : 'Add more...'}
              disabled={disabled}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]"
            />
          </div>
        )}
      </div>

      {helperText && (
        <p className="mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
          {helperText}
        </p>
      )}
    </div>
  )
}
