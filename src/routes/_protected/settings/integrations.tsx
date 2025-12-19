
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@/lib/abac'

export const Route = createFileRoute('/_protected/settings/integrations')({
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
    component: IntegrationsSettingsPage,
})

function IntegrationsSettingsPage() {
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
