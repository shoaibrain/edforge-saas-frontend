import { createFileRoute, redirect } from '@tanstack/react-router'
import { Atom } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/enrollment')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'curriculum', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: EnrollmentPage,
})

function EnrollmentPage() {
  return (
    <BootstrapPage
      title="Enrollment"
      description="Manage admissions, enrollment pipelines, and student onboarding"
      icon={Atom}
      requiresActiveSchool
    />
  )
}
