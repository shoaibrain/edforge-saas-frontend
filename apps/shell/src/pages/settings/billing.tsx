/**
 * Billing Settings Page
 * 
 * Manage subscription and payment methods. TenantAdmin only.
 */

import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { CreditCard, ShieldX } from 'lucide-react'
import { Button } from '@edforge/ui'
import { SettingsRow } from '@/components/settings/SettingsShared'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'

export default function BillingSettingsPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (user.globalRole !== 'TenantAdmin') {
    return <AccessDenied message="Only Tenant Administrators can access billing settings." />
  }

  const hasPermission = can(user, {
    action: 'manage',
    resource: 'settings:tenant',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to manage billing settings." />
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
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Billing</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Manage your subscription and payment methods
          </p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.14)] to-[rgb(var(--state-info-bg)/0.14)] border border-[rgb(var(--border-focus)/0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">Current Plan</p>
              <p className="text-xl font-bold text-[rgb(var(--text-primary))]">Free</p>
            </div>
            <Button>Upgrade</Button>
          </div>
        </div>

        <div className="space-y-4">
          <SettingsRow 
            icon={CreditCard} 
            title="Payment Method" 
            description="No payment method added" 
            action={<Button variant="outline" size="sm">Add</Button>} 
          />
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
