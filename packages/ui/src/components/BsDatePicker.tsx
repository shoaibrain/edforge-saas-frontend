/**
 * Bikram Sambat Date Picker
 *
 * Calendar grid displaying BS months/days. Always emits Gregorian ISO dates.
 * Accepts Gregorian ISO as value, displays in BS.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  gregorianToBs,
  bsToGregorian,
  getBsMonthDays,
  getBsMonthName,
  isBsYearSupported,
} from '@aibrains/shared-types'

interface BsDatePickerProps {
  value?: string  // Gregorian ISO date
  onChange: (isoDate: string) => void
  minDate?: string  // Gregorian ISO
  maxDate?: string  // Gregorian ISO
  disabled?: boolean
  className?: string
}

export function BsDatePicker({ value, onChange, disabled, className }: BsDatePickerProps) {
  // Convert current value to BS
  const currentBs = useMemo(() => {
    if (value) {
      try { return gregorianToBs(value) } catch { /* fall through */ }
    }
    const now = new Date()
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return gregorianToBs(iso)
  }, [value])

  const [viewYear, setViewYear] = useState(currentBs.year)
  const [viewMonth, setViewMonth] = useState(currentBs.month)

  const daysInMonth = useMemo(() => {
    try { return getBsMonthDays(viewYear, viewMonth) } catch { return 30 }
  }, [viewYear, viewMonth])

  // First day of BS month in Gregorian → get day of week
  const firstDayOfWeek = useMemo(() => {
    try {
      const iso = bsToGregorian(viewYear, viewMonth, 1)
      return new Date(iso).getDay() // 0=Sun
    } catch { return 0 }
  }, [viewYear, viewMonth])

  const handleDayClick = useCallback((day: number) => {
    if (disabled) return
    try {
      const iso = bsToGregorian(viewYear, viewMonth, day)
      onChange(iso)
    } catch { /* invalid date */ }
  }, [viewYear, viewMonth, onChange, disabled])

  const navigateMonth = (delta: number) => {
    let newMonth = viewMonth + delta
    let newYear = viewYear
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (isBsYearSupported(newYear)) {
      setViewMonth(newMonth)
      setViewYear(newYear)
    }
  }

  const isSelected = (day: number) =>
    currentBs.year === viewYear && currentBs.month === viewMonth && currentBs.day === day

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={`bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-xl p-4 w-80 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => navigateMonth(-1)} className="p-1 rounded hover:bg-[rgb(var(--interactive-hover))]">
          &larr;
        </button>
        <div className="text-center">
          <div className="font-semibold text-sm text-[rgb(var(--text-primary))]">
            {getBsMonthName(viewMonth)} {viewYear}
          </div>
          <div className="text-xs text-[rgb(var(--text-tertiary))]">
            BS ({viewYear - 57} AD approx.)
          </div>
        </div>
        <button type="button" onClick={() => navigateMonth(1)} className="p-1 rounded hover:bg-[rgb(var(--interactive-hover))]">
          &rarr;
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-[rgb(var(--text-tertiary))] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const selected = isSelected(day)
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={`
                text-center text-sm py-1.5 rounded-lg transition-colors
                ${selected
                  ? 'bg-teal-500 text-white font-semibold'
                  : 'hover:bg-[rgb(var(--interactive-hover))] text-[rgb(var(--text-primary))]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Selected date display */}
      {value && (
        <div className="mt-3 pt-2 border-t border-[rgb(var(--border-secondary))] text-xs text-[rgb(var(--text-secondary))] flex justify-between">
          <span>BS: {currentBs.year}/{String(currentBs.month).padStart(2, '0')}/{String(currentBs.day).padStart(2, '0')}</span>
          <span>AD: {value}</span>
        </div>
      )}
    </div>
  )
}

/**
 * DateInput wrapper — renders BS picker or standard date input
 * based on school's calendar system.
 */
interface DateInputProps {
  value?: string
  onChange: (isoDate: string) => void
  calendarSystem?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function DateInput({ value, onChange, calendarSystem = 'gregorian', label, error, disabled, className }: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false)

  if (calendarSystem === 'bikram_sambat') {
    const displayValue = value
      ? (() => { try { const bs = gregorianToBs(value); return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}` } catch { return value } })()
      : ''

    return (
      <div className={`relative ${className || ''}`}>
        {label && <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">{label}</label>}
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder="YYYY/MM/DD (BS)"
          onClick={() => !disabled && setShowPicker(!showPicker)}
          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] text-sm cursor-pointer"
        />
        {showPicker && (
          <div className="absolute z-50 mt-1">
            <BsDatePicker
              value={value}
              onChange={(iso) => { onChange(iso); setShowPicker(false) }}
              disabled={disabled}
            />
          </div>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  // Standard Gregorian date input
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">{label}</label>}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] text-sm"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
