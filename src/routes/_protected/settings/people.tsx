
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@/lib/abac'

export const Route = createFileRoute('/_protected/settings/people')({
    beforeLoad: () => {
        const { user } = useAuthStore.getState()
        const { activeSchoolId } = useAppStore.getState()

        if (!user) {
            throw redirect({ to: '/login' })
        }

        const ok = can(user, {
            action: 'view',
            resource: 'staff',
            schoolId: activeSchoolId ?? undefined,
        })

        if (!ok) {
            throw redirect({ to: '/forbidden' })
        }
    },
    component: PeopleSettingsPage,
})

function PeopleSettingsPage() {
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
                        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">People</h1>
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
