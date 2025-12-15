import { createFileRoute, redirect } from '@tanstack/react-router'
import { ContactRound } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/teachers')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'students', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: TeachersPage,
})

function TeachersPage() {
  return (
    <BootstrapPage
      title="Teachers"
      description="Teacher directory, assignments, and academic responsibilities"
      icon={ContactRound}
      requiresActiveSchool
    />
  )
}
