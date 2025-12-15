import { createFileRoute, redirect } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/academics/curriculum')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'curriculum', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: CurriculumPage,
})

function CurriculumPage() {
  return (
    <BootstrapPage
      title="Curriculum"
      description="Subjects, syllabi, and instructional planning"
      icon={ClipboardList}
      requiresActiveSchool
    />
  )
}
