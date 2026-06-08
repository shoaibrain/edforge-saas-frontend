/**
 * Bikram Sambat Date Picker
 *
 * Calendar grid displaying BS months/days. Always emits Gregorian ISO dates.
 * Accepts Gregorian ISO as value, displays in BS.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  gregorianToBs,
  bsToGregorian,
  getBsMonthDays,
  getBsMonthName,
  isBsYearSupported,
} from '@aibrains/shared-types'
import { focusRingInset } from '../utils'

interface BsDatePickerProps {
  value?: string  // Gregorian ISO date
  onChange: (isoDate: string) => void
  minDate?: string  // Gregorian ISO
  maxDate?: string  // Gregorian ISO
  disabled?: boolean
  className?: string
}

export function BsDatePicker({ value, onChange, disabled, className }: BsDatePickerProps) {
  const { i18n } = useTranslation()
  const bsLocale = (i18n.language === 'ne' ? 'ne' : 'en') as 'en' | 'ne'

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

  const navigateYear = (delta: number) => {
    const newYear = viewYear + delta
    if (isBsYearSupported(newYear)) {
      setViewYear(newYear)
    }
  }

  const isSelected = (day: number) =>
    currentBs.year === viewYear && currentBs.month === viewMonth && currentBs.day === day

  const dayNames = bsLocale === 'ne'
    ? ['आ', 'सो', 'मं', 'बु', 'बि', 'शु', 'श']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div
      className={`bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-popover p-3 w-72 ${className || ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Bikram Sambat calendar: ${getBsMonthName(viewMonth, bsLocale)} ${viewYear}`}
    >
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={() => navigateYear(-1)}
          className="p-1 rounded text-xs text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--interactive-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
          aria-label={`Previous year: ${viewYear - 1}`}
        >
          &laquo;
        </button>
        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
          {viewYear} BS
        </span>
        <button
          type="button"
          onClick={() => navigateYear(1)}
          className="p-1 rounded text-xs text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--interactive-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
          aria-label={`Next year: ${viewYear + 1}`}
        >
          &raquo;
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-[rgb(var(--interactive-hover))] text-[rgb(var(--text-secondary))] transition-colors"
          aria-label="Previous month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="text-center">
          <div className="font-semibold text-sm text-[rgb(var(--text-primary))]">
            {getBsMonthName(viewMonth, bsLocale)}
          </div>
          <div className="text-xs text-[rgb(var(--text-tertiary))]">
            ~{viewYear - 57} AD
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="p-1.5 rounded-lg hover:bg-[rgb(var(--interactive-hover))] text-[rgb(var(--text-secondary))] transition-colors"
          aria-label="Next month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-[rgb(var(--text-tertiary))] py-1 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
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
              aria-label={`${day} ${getBsMonthName(viewMonth, bsLocale)} ${viewYear}`}
              aria-pressed={selected}
              className={`
                aspect-square flex items-center justify-center text-xs rounded-lg transition-colors
                ${selected
                  ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] font-semibold shadow-sm'
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
        <div className="mt-2 pt-2 border-t border-[rgb(var(--border-secondary))] text-xs text-[rgb(var(--text-tertiary))] flex justify-between">
          <span>BS: {currentBs.year}/{String(currentBs.month).padStart(2, '0')}/{String(currentBs.day).padStart(2, '0')}</span>
          <span>AD: {value}</span>
        </div>
      )}
    </div>
  )
}

/**
 * DateInput wrapper — renders BS picker or standard date input
 * based on school's calendar system. Uses portal for popup to avoid
 * clipping in modals and overflow containers.
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
  const { i18n } = useTranslation()
  const bsLocale = (i18n.language === 'ne' ? 'ne' : 'en') as 'en' | 'ne'
  const [showPicker, setShowPicker] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Click-outside-to-close
  useEffect(() => {
    if (!showPicker) return
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showPicker])

  // Escape to close
  useEffect(() => {
    if (!showPicker) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showPicker])

  // Calculate popup position
  const getPopupStyle = (): React.CSSProperties => {
    if (!triggerRef.current) return { position: 'fixed', top: 0, left: 0 }
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openAbove = spaceBelow < 320

    return {
      position: 'fixed',
      left: Math.min(rect.left, window.innerWidth - 296), // 280px picker + 16px margin
      top: openAbove ? undefined : rect.bottom + 4,
      bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined,
      zIndex: 9999,
    }
  }

  if (calendarSystem === 'bikram_sambat') {
    const displayValue = value
      ? (() => { try { const bs = gregorianToBs(value); return `${getBsMonthName(bs.month, bsLocale)} ${bs.day}, ${bs.year}` } catch { return value } })()
      : ''

    return (
      <div className={className}>
        {label && <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{label}</label>}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setShowPicker(!showPicker)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all
            ${showPicker
              ? 'border-[rgb(var(--border-focus))] ring-2 ring-[rgb(var(--border-focus)/0.24)]'
              : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
            }
            bg-[rgb(var(--surface-secondary))]
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--text-tertiary))] flex-shrink-0"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <span className={displayValue ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-tertiary))]'}>
            {displayValue || 'Select date (BS)'}
          </span>
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); onChange(''); setShowPicker(false) }}
              className="ml-auto text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
              aria-label="Clear date"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </span>
          )}
        </button>
        {showPicker && createPortal(
          <div ref={popupRef} style={getPopupStyle()}>
            <BsDatePicker
              value={value}
              onChange={(iso) => { onChange(iso); setShowPicker(false) }}
              disabled={disabled}
            />
          </div>,
          document.body,
        )}
        {error && <p className="text-xs text-[rgb(var(--state-danger-fg))] mt-1">{error}</p>}
      </div>
    )
  }

  // Standard Gregorian date input
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{label}</label>}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm transition-all ${focusRingInset}`}
      />
      {error && <p className="text-xs text-[rgb(var(--state-danger-fg))] mt-1">{error}</p>}
    </div>
  )
}
