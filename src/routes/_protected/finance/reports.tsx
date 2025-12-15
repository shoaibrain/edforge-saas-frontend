import { createFileRoute, redirect } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/finance/reports')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'reports:finance', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: FinanceReportsPage,
})

function FinanceReportsPage() {
  return (
    <BootstrapPage
      title="Reports"
      description="Financial analytics, exports, and reporting"
      icon={BarChart3}
      requiresActiveSchool
    />
  )
}
