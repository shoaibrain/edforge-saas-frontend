/**
 * AcademicYearLabel
 *
 * Compact inline label showing the current academic year, term,
 * and progress percentage. Designed to sit next to the "Updated just now"
 * indicator in the top-right corner of the overview page.
 */

import { Calendar } from 'lucide-react'
import type { AcademicCalendarContext } from '../../hooks/useAcademicsOverview'

// ============================================================================
// TYPES
// ============================================================================

interface AcademicYearLabelProps {
  context: AcademicCalendarContext
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AcademicYearLabel({ context }: AcademicYearLabelProps) {
  const {
    currentYear,
    currentTerm,
    termProgressPercent,
    isLoading,
    isBetweenTerms,
  } = context

  if (isLoading || !currentYear) return null

  return (
    <span className="hidden sm:flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
      <Calendar className="w-3 h-3" />
      <span>
        {currentYear.name}
        {currentTerm && (
          <>
            <span className="mx-0.5">&middot;</span>
            {currentTerm.name}
          </>
        )}
        {isBetweenTerms && (
          <span className="ml-1 opacity-70">(Break)</span>
        )}
        {termProgressPercent != null && (
          <span className="ml-0.5 opacity-70">&middot; {termProgressPercent}%</span>
        )}
      </span>
    </span>
  )
}
