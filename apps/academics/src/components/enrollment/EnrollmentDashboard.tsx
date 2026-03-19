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
      <div
        className="p-8 text-center"
        style={{
          borderRadius: 10,
          border: '2px dashed rgba(239, 159, 39, 0.3)',
          background: 'var(--v2-warning-bg)',
        }}
      >
        <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#EF9F27' }} />
        <h3
          className="font-semibold mb-2"
          style={{ fontSize: 14, color: 'var(--v2-text-primary)' }}
        >
          No active academic year for this school
        </h3>
        <p
          className="max-w-md mx-auto"
          style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}
        >
          Set up and activate an academic year in School Settings to begin enrolling students and viewing enrollment data.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {activeYear && (
          <div
            className="h-14 rounded-[10px] animate-pulse"
            style={{ background: 'rgba(255, 255, 255, 0.04)' }}
          />
        )}
      </div>
    )
  }

  return null
}
