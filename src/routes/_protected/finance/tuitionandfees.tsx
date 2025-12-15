import { createFileRoute, redirect } from '@tanstack/react-router'
import { BanknoteArrowUp } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/finance/tuitionandfees')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'payroll', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: TuitionAndFeesPage,
})

function TuitionAndFeesPage() {
  return (
    <BootstrapPage
      title="Tuition & Fees"
      description="Manage tuition structures, fees, and fee schedules"
      icon={BanknoteArrowUp}
      requiresActiveSchool
    />
  )
}
