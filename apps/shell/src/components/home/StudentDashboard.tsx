/**
 * StudentDashboard
 *
 * Home page layout for students.
 * Shows quick actions for academic tasks.
 */

import { QuickActionsWidget } from '../dynamic-page/widgets/QuickActionsWidget'

interface StudentDashboardProps {
  schoolId: string | null
}

export function StudentDashboard({ schoolId }: StudentDashboardProps) {
  if (!schoolId) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          Select a school from the sidebar to view your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions — uses existing student config */}
      <QuickActionsWidget columns={4} />
    </div>
  )
}
