/**
 * SchoolDaysSelector Component
 * 
 * Visual day-of-week selector for school operating days.
 * Supports selecting multiple days (Mon-Sun).
 */

import { motion } from 'framer-motion'

const DAYS = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
]

interface SchoolDaysSelectorProps {
  selected: number[] // 0=Sunday, 1=Monday, ..., 6=Saturday
  onChange: (days: number[]) => void
  disabled?: boolean
}

export function SchoolDaysSelector({ selected, onChange, disabled }: SchoolDaysSelectorProps) {
  const toggleDay = (day: number) => {
    if (disabled) return
    
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day))
    } else {
      onChange([...selected, day].sort((a, b) => a - b))
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {DAYS.map((day) => {
        const isSelected = selected.includes(day.value)
        return (
          <motion.button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            className={`
              relative w-10 h-10 rounded-lg text-sm font-medium
              transition-all duration-150 outline-none
              ${isSelected
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-primary))]
            `}
            title={day.fullLabel}
          >
            {day.label}
            {isSelected && (
              <motion.div
                layoutId={`day-indicator-${day.value}`}
                className="absolute inset-0 rounded-lg bg-teal-500 -z-10"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// Helper to convert backend schoolDays array to human-readable string
export function formatSchoolDays(days: number[]): string {
  if (days.length === 0) return 'No days selected'
  if (days.length === 7) return 'Every day'
  
  const sortedDays = [...days].sort((a, b) => a - b)
  
  // Check for common patterns
  const weekdays = [1, 2, 3, 4, 5]
  const isWeekdays = weekdays.every(d => sortedDays.includes(d)) && sortedDays.length === 5
  if (isWeekdays) return 'Weekdays (Mon-Fri)'
  
  // Return individual days
  const dayNames = sortedDays.map(d => DAYS.find(day => day.value === d)?.fullLabel || '')
  return dayNames.join(', ')
}
