import { createFileRoute, redirect } from '@tanstack/react-router'
import { Layers } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/gradelevels')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'students', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: GradeLevelsPage,
})

function GradeLevelsPage() {
  return (
    <BootstrapPage
      title="Grade Levels"
      description="Define and manage grade structures for your school"
      icon={Layers}
      requiresActiveSchool
    />
  )
}
