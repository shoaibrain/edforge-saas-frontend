import { createFileRoute, redirect } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/finance/expenses')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'expenses', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ExpensesPage,
})

function ExpensesPage() {
  return (
    <BootstrapPage
      title="Expenses"
      description="Track, approve, and report on expenses"
      icon={ClipboardList}
      requiresActiveSchool
    />
  )
}
