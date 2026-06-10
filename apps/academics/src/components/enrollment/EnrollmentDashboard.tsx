/**
 * EnrollmentDashboard Component — V2
 *
 * Shows setup prompt when no active academic year exists.
 * Stats strip and progress bar are rendered in the parent enrollment page.
 * Uses V2 design tokens for styling.
 */

import { AlertTriangle } from 'lucide-react'
import type { AcademicYearResponseDto } from '../../services/school.service'

interface EnrollmentDashboardProps {
  isLoading: boolean
  activeYear?: AcademicYearResponseDto | null
}

export function EnrollmentDashboard({ isLoading, activeYear }: EnrollmentDashboardProps) {
  // No active year — show setup prompt
  if (!isLoading && !activeYear) {
    return (
      <div className="p-8 text-center rounded-[10px] border-2 border-dashed border-[rgb(var(--accent-attendance)/0.3)] bg-[rgb(var(--state-warning-bg))]">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--accent-attendance))]" />
        <h3 className="font-semibold mb-2 text-sm text-[rgb(var(--text-primary))]">
          No active academic year for this school
        </h3>
        <p className="max-w-md mx-auto text-xs text-[rgb(var(--text-tertiary))]">
          Set up and activate an academic year in School Settings to begin enrolling students and viewing enrollment data.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {activeYear && (
          <div className="h-14 rounded-[10px] animate-pulse bg-[rgb(var(--background-tertiary))]" />
        )}
      </div>
    )
  }

  return null
}
