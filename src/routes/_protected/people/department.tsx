import { createFileRoute, redirect } from '@tanstack/react-router'
import { Component } from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export const Route = createFileRoute('/_protected/people/department')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: DepartmentPage,
})

function DepartmentPage() {
  return (
    <BootstrapPage
      title="Departments"
      description="Department structure, ownership, and staff grouping"
      icon={Component}
      requiresActiveSchool
    />
  )
}
