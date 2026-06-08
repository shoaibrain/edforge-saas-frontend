/**
 * BSDateInput — Controlled Bikram Sambat date input with three fields.
 *
 * Renders separate Year / Month / Day inputs for BS dates.
 * Validates against the BS lookup table and shows the Gregorian equivalent.
 * Emits both AD Date and BSDate objects on change.
 */

import { useState, useEffect, useCallback } from 'react'
import type { BSDate } from '../types'
import { bsToAD, isValidBSDate, getDaysInBSMonth, BS_MONTH_NAMES_EN } from '../converter'

// ============================================================================
// TYPES
// ============================================================================

export interface BSDateInputProps {
  /** Current value as BSDate (controlled) */
  value?: BSDate | null
  /** Called with AD date and BS date when a valid date is entered */
  onChange: (adDate: Date, bsDate: BSDate) => void
  /** Called when the date becomes invalid or is cleared */
  onInvalid?: (error: string) => void
  /** Label for the field group */
  label?: string
  /** External error message */
  error?: string
  /** Disable the input */
  disabled?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BSDateInput({
  value,
  onChange,
  onInvalid,
  label,
  error: externalError,
  disabled,
}: BSDateInputProps) {
  const [year, setYear] = useState<string>(value?.year?.toString() ?? '')
  const [month, setMonth] = useState<number>(value?.month ?? 1)
  const [day, setDay] = useState<string>(value?.day?.toString() ?? '')
  const [internalError, setInternalError] = useState<string>('')

  // Sync from controlled value
  useEffect(() => {
    if (value) {
      setYear(value.year.toString())
      setMonth(value.month)
      setDay(value.day.toString())
    }
  }, [value?.year, value?.month, value?.day])

  const validate = useCallback(
    (y: number, m: number, d: number) => {
      const bs: BSDate = { year: y, month: m, day: d }

      if (y < 2000 || y > 2090) {
        const msg = 'BS year must be between 2000 and 2090'
        setInternalError(msg)
        onInvalid?.(msg)
        return
      }

      if (m < 1 || m > 12) {
        const msg = 'BS month must be between 1 and 12'
        setInternalError(msg)
        onInvalid?.(msg)
        return
      }

      const maxDay = getDaysInBSMonth(y, m)
      if (d < 1 || d > maxDay) {
        const msg = `BS day must be between 1 and ${maxDay} for ${BS_MONTH_NAMES_EN[m - 1]} ${y}`
        setInternalError(msg)
        onInvalid?.(msg)
        return
      }

      if (!isValidBSDate(bs)) {
        const msg = 'Invalid BS date'
        setInternalError(msg)
        onInvalid?.(msg)
        return
      }

      setInternalError('')
      const adDate = bsToAD(bs)
      onChange(adDate, bs)
    },
    [onChange, onInvalid],
  )

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setYear(val)
    const y = parseInt(val, 10)
    const d = parseInt(day, 10)
    if (!isNaN(y) && !isNaN(d)) {
      validate(y, month, d)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10)
    setMonth(m)
    const y = parseInt(year, 10)
    const d = parseInt(day, 10)
    if (!isNaN(y) && !isNaN(d)) {
      // Clamp day to max for new month
      const maxDay = getDaysInBSMonth(y, m)
      const clampedDay = Math.min(d, maxDay)
      if (clampedDay !== d) {
        setDay(clampedDay.toString())
      }
      validate(y, m, clampedDay)
    }
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDay(val)
    const y = parseInt(year, 10)
    const d = parseInt(val, 10)
    if (!isNaN(y) && !isNaN(d)) {
      validate(y, month, d)
    }
  }

  // Compute Gregorian equivalent for display
  const adEquivalent = (() => {
    const y = parseInt(year, 10)
    const d = parseInt(day, 10)
    if (isNaN(y) || isNaN(d)) return null
    const bs: BSDate = { year: y, month, day: d }
    if (!isValidBSDate(bs)) return null
    const ad = bsToAD(bs)
    return ad.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  })()

  const displayError = externalError || internalError

  const maxDay = (() => {
    const y = parseInt(year, 10)
    if (isNaN(y) || y < 2000 || y > 2090) return 32
    return getDaysInBSMonth(y, month)
  })()

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </label>
      )}

      <div className="grid grid-cols-3 gap-2">
        {/* BS Year */}
        <div>
          <label className="block text-xs text-[rgb(var(--text-tertiary))] mb-1">Year (BS)</label>
          <input
            type="number"
            min={2000}
            max={2090}
            value={year}
            onChange={handleYearChange}
            disabled={disabled}
            placeholder="2082"
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(10,147,150)] ${
              displayError ? 'border-[rgb(185,62,3)]' : 'border-[rgb(var(--border-primary))]'
            }`}
          />
        </div>

        {/* BS Month */}
        <div>
          <label className="block text-xs text-[rgb(var(--text-tertiary))] mb-1">Month</label>
          <select
            value={month}
            onChange={handleMonthChange}
            disabled={disabled}
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-primary))] appearance-none focus:outline-none focus:border-[rgb(10,147,150)] ${
              displayError ? 'border-[rgb(185,62,3)]' : 'border-[rgb(var(--border-primary))]'
            }`}
          >
            {BS_MONTH_NAMES_EN.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name} ({i + 1})
              </option>
            ))}
          </select>
        </div>

        {/* BS Day */}
        <div>
          <label className="block text-xs text-[rgb(var(--text-tertiary))] mb-1">Day</label>
          <input
            type="number"
            min={1}
            max={maxDay}
            value={day}
            onChange={handleDayChange}
            disabled={disabled}
            placeholder="1"
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgb(10,147,150)] ${
              displayError ? 'border-[rgb(185,62,3)]' : 'border-[rgb(var(--border-primary))]'
            }`}
          />
        </div>
      </div>

      {/* Gregorian equivalent */}
      {adEquivalent && !displayError && (
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          Gregorian: {adEquivalent}
        </p>
      )}

      {/* Error display */}
      {displayError && (
        <p className="text-xs text-[rgb(185,62,3)]">{displayError}</p>
      )}
    </div>
  )
}
