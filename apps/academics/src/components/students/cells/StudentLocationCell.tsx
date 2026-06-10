/**
 * StudentLocationCell — Nepal-aware locality for the Students roster.
 *
 * Pin + two-line "Municipality / District" (fallback "City / State") from the
 * shared formatStudentLocation util. Muted em-dash when no address is on file.
 */

import { MapPin } from 'lucide-react'
import type { Address } from '@aibrains/shared-types'
import { formatStudentLocation } from '../../../utils/student-location'

interface StudentLocationCellProps {
  address?: Address | null
}

export function StudentLocationCell({ address }: StudentLocationCellProps) {
  const locality = formatStudentLocation(address)

  if (!locality) {
    return <span className="text-xs text-[rgb(var(--text-tertiary))]">—</span>
  }

  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[rgb(var(--text-tertiary))]" />
      <div className="min-w-0">
        <div className="text-xs font-medium truncate text-[rgb(var(--text-secondary))]">
          {locality.primary}
        </div>
        {locality.secondary && (
          <div className="text-xs truncate text-[rgb(var(--text-tertiary))]">
            {locality.secondary}
          </div>
        )}
      </div>
    </div>
  )
}
