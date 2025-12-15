import { createFileRoute, redirect } from '@tanstack/react-router'
import { UsersRound } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/people/staff')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: StaffPage,
})

function StaffPage() {
  return (
    <BootstrapPage
      title="Colleagues"
      description="Staff directory, roles, and organization"
      icon={UsersRound}
      requiresActiveSchool
    />
  )
}
