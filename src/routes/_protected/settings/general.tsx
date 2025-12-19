
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Building2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SettingsRow } from '@/components/settings/SettingsShared'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { can } from '@/lib/abac'

export const Route = createFileRoute('/_protected/settings/general')({
    beforeLoad: () => {
        const { user } = useAuthStore.getState()
        const { activeSchoolId } = useAppStore.getState()

        if (!user) {
            throw redirect({ to: '/login' })
        }

        const ok = can(user, {
            action: 'view',
            resource: 'settings',
            schoolId: activeSchoolId ?? undefined,
        })

        if (!ok) {
            throw redirect({ to: '/forbidden' })
        }
    },
    component: GeneralSettingsPage,
})

function GeneralSettingsPage() {
    const activeSchoolId = useAppStore((s) => s.activeSchoolId)
    const school = activeSchoolId ? MOCK_SCHOOLS[activeSchoolId] : null

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
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">General</h1>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Workspace settings and preferences
                    </p>
                </div>

                <div className="p-6 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                            {school?.name?.charAt(0) || 'W'}
                        </div>
                        <div>
                            <p className="font-semibold text-[rgb(var(--text-primary))]">{school?.name || 'My Workspace'}</p>
                            <p className="text-sm text-[rgb(var(--text-tertiary))]">Free Plan • 1 member</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <SettingsRow icon={Building2} title="Workspace Name" description={school?.name || 'My Workspace'} action={<Button variant="ghost" size="sm">Edit</Button>} />
                    <SettingsRow icon={Globe} title="Workspace URL" description="edforge.app/workspace-name" action={<Button variant="ghost" size="sm">Copy</Button>} />
                </div>
            </motion.div>
        </div>
    )
}
