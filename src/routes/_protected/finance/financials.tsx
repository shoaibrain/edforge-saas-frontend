import { createFileRoute, redirect } from '@tanstack/react-router'
import { Landmark } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/finance/financials')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'billing', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: FinancialsPage,
})

function FinancialsPage() {
  return (
    <BootstrapPage
      title="Financials"
      description="Overview of billing, collections, and financial operations"
      icon={Landmark}
      requiresActiveSchool
    />
  )
}
