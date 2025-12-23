import { Navigate } from '@tanstack/react-router'
import { can } from '@edforge/abac'
import { UsersRound } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { BootstrapPage } from '@/components/layout/BootstrapPage'

export default function StaffPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
    return <Navigate to={'/forbidden' as any} />
  }

  return (
    <BootstrapPage
      title="Colleagues"
      description="Staff directory, roles, and organization"
      icon={UsersRound}
      requiresActiveSchool
    />
  )
}
