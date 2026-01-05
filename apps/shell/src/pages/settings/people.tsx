/**
 * Access Policy / People Settings Page
 * 
 * Manage workspace members and roles.
 */

import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Users, ShieldX } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'

export default function PeopleSettingsPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'view',
    resource: 'staff',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view access policy settings." />
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
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Access Policy</h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Manage workspace members and roles
            </p>
          </div>
          <Button>Add Members</Button>
        </div>

        <div className="text-center py-12 text-[rgb(var(--text-tertiary))]">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Invite your team</p>
          <p className="text-sm mt-1">Add members to collaborate together</p>
          <Button variant="outline" className="mt-4">Send Invites</Button>
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
