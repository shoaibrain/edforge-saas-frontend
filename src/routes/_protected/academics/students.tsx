import { createFileRoute, redirect } from '@tanstack/react-router'
import { UsersRound } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/students')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'students', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: StudentsPage,
})

function StudentsPage() {
  return (
    <BootstrapPage
      title="Students"
      description="Enrollment, profiles, and student records"
      icon={UsersRound}
      requiresActiveSchool
    />
  )
}
