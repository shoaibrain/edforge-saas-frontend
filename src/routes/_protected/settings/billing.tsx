
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SettingsRow } from '@/components/settings/SettingsShared'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@/lib/abac'

export const Route = createFileRoute('/_protected/settings/billing')({
    beforeLoad: () => {
        const { user } = useAuthStore.getState()
        const { activeSchoolId } = useAppStore.getState()

        if (!user) {
            throw redirect({ to: '/login' })
        }

        if (user.globalRole !== 'TenantAdmin') {
            throw redirect({ to: '/forbidden' })
        }

        const ok = can(user, {
            action: 'manage',
            resource: 'settings:tenant',
            schoolId: activeSchoolId ?? undefined,
        })

        if (!ok) {
            throw redirect({ to: '/forbidden' })
        }
    },
    component: BillingSettingsPage,
})

function BillingSettingsPage() {
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

                <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[rgb(var(--text-tertiary))]">Current Plan</p>
                            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">Free</p>
                        </div>
                        <Button>Upgrade</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <SettingsRow icon={CreditCard} title="Payment Method" description="No payment method added" action={<Button variant="outline" size="sm">Add</Button>} />
                </div>
            </motion.div>
        </div>
    )
}
