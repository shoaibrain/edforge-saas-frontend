import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth.store'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/_protected')({
  beforeLoad: () => {
    const { token, user } = useAuthStore.getState()

    // Redirect to login if not authenticated
    if (!token || !user) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

