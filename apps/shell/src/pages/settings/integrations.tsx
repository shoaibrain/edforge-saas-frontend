/**
 * Integrations Settings Page
 * 
 * Connect third-party services. TenantAdmin only.
 */

import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Zap, ShieldX } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'

export default function IntegrationsSettingsPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (user.globalRole !== 'TenantAdmin') {
    return <AccessDenied message="Only Tenant Administrators can manage integrations." />
  }

  const hasPermission = can(user, {
    action: 'manage',
    resource: 'settings:tenant',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to manage integrations." />
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Integrations</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Connect third-party services
          </p>
        </div>

        <div className="text-center py-12 text-[rgb(var(--text-tertiary))]">
          <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No integrations yet</p>
          <p className="text-sm mt-1">Connect apps to automate your workflow</p>
        </div>
      </motion.div>
    </div>
  )
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-4">
          <ShieldX className="w-8 h-8 text-rust-500" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
