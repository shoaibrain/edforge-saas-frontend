/**
 * Schools Settings Page
 * 
 * Manage schools in the workspace. Tenant-level configuration.
 */

import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ChevronRight, ShieldX } from 'lucide-react'
import { Button } from '@edforge/ui'
import { MOCK_SCHOOLS, useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'

export default function SchoolsSettingsPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'view',
    resource: 'settings:school',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to manage schools." />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Schools</h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Manage schools in your workspace
            </p>
          </div>
          <Button>Add School</Button>
        </div>

        <div className="space-y-3">
          {Object.entries(MOCK_SCHOOLS).slice(0, 3).map(([id, school]) => (
            <div 
              key={id} 
              className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-teal-500/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                  {school.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-[rgb(var(--text-primary))]">{school.name}</p>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">{school.code}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            </div>
          ))}
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
