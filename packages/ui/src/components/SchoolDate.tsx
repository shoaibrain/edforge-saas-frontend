/**
 * SchoolDate
 *
 * Date display component that auto-formats based on school's calendarSystem.
 * Reads calendarSystem from props or a context (if provided by the app shell).
 *
 * Usage:
 *   <SchoolDate date="2026-04-14" calendarSystem="bikram_sambat" />
 *   → "2083/01/01"
 *
 *   <SchoolDate date="2026-04-14" calendarSystem="gregorian" />
 *   → "2026-04-14"
 */

import { useMemo } from 'react'
import { formatSchoolDate } from '@aibrains/shared-types'
import { Bdi } from './Bdi'

interface SchoolDateProps {
  date: string | null | undefined
  calendarSystem?: string
  format?: string
  className?: string
  fallback?: string
}

export function SchoolDate({
  date,
  calendarSystem = 'gregorian',
  format,
  className,
  fallback = '—',
}: SchoolDateProps) {
  const formatted = useMemo(() => {
    if (!date) return fallback
    try {
      return formatSchoolDate(date, calendarSystem, format)
    } catch {
      return date
    }
  }, [date, calendarSystem, format, fallback])

  // Date strings are LTR islands — isolate so they don't reorder in RTL. No-op in LTR.
  return (
    <span className={className}>
      <Bdi>{formatted}</Bdi>
    </span>
  )
}
