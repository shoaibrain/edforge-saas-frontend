
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@/lib/abac'

export const Route = createFileRoute('/_protected/settings/data')({
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
    component: DataSettingsPage,
})

function DataSettingsPage() {
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
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Import/Export</h1>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Manage your workspace data
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
                        <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Import Data</h3>
                        <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
                            Import students, staff, and other data from CSV or Excel files.
                        </p>
                        <Button variant="outline">Import from File</Button>
                    </div>

                    <div className="p-6 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
                        <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Export Data</h3>
                        <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
                            Download your workspace data in various formats.
                        </p>
                        <Button variant="outline">Export All Data</Button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
