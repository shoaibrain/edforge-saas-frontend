import { createFileRoute, redirect } from '@tanstack/react-router'
import { BanknoteArrowDown } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/finance/payroll')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'payroll', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: PayrollPage,
})

function PayrollPage() {
  return (
    <BootstrapPage
      title="Payroll"
      description="Payroll processing, approvals, and payroll reporting"
      icon={BanknoteArrowDown}
      requiresActiveSchool
    />
  )
}
