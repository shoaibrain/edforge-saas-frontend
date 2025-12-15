import { createFileRoute, redirect } from '@tanstack/react-router'
import { ChartNoAxesCombined } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/people/reporting')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'attendance', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ReportingPage,
})

function ReportingPage() {
  return (
    <BootstrapPage
      title="Reporting"
      description="People analytics, reports, and insights"
      icon={ChartNoAxesCombined}
      requiresActiveSchool
    />
  )
}

