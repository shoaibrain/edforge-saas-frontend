/**
 * TeacherDashboard
 *
 * Home page layout for teachers/educators.
 * Shows assigned sections and quick actions for classroom management.
 */

import { WidgetSection } from '../dynamic-page/WidgetSection'
import { QuickActionsWidget } from '../dynamic-page/widgets/QuickActionsWidget'
import { MySectionsCard } from './MySectionsCard'
import { useHomeAcademicYear, useHomeTeacherSections } from '../../hooks/useHomeData'
import { CalendarDays } from 'lucide-react'

interface TeacherDashboardProps {
  schoolId: string | null
}

export function TeacherDashboard({ schoolId }: TeacherDashboardProps) {
  const { data: academicYear } = useHomeAcademicYear(schoolId)
  const { sections, isLoading } = useHomeTeacherSections(
    schoolId,
    academicYear?.yearId,
  )

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
      {/* My Sections */}
      <WidgetSection
        widgetId="home-teacher-sections"
        label="My Sections"
        icon={CalendarDays}
      >
        <MySectionsCard sections={sections} isLoading={isLoading} />
      </WidgetSection>

      {/* Quick Actions — uses existing teacher config */}
      <QuickActionsWidget columns={4} />
    </div>
  )
}
