import { createFileRoute, redirect } from '@tanstack/react-router'
import { Calendars } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/schoolcalendar')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'curriculum', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: SchoolCalendarPage,
})

function SchoolCalendarPage() {
  return (
    <BootstrapPage
      title="School Calendar"
      description="Academic years, terms, and calendar configuration"
      icon={Calendars}
      requiresActiveSchool
    />
  )
}
