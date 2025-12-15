import { createFileRoute, redirect } from '@tanstack/react-router'
import { MapPinHouse } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/classrooms')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'classes', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ClassroomsPage,
})

function ClassroomsPage() {
  return (
    <BootstrapPage
      title="Classrooms"
      description="Manage classrooms, sections, and room assignments"
      icon={MapPinHouse}
      requiresActiveSchool
    />
  )
}
