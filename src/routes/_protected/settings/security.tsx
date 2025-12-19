
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Key, Smartphone, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SettingsRow } from '@/components/settings/SettingsShared'

export const Route = createFileRoute('/_protected/settings/security')({
    component: SecurityPage,
})

function SecurityPage() {
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
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Security</h1>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Manage your account security settings
                    </p>
                </div>

                <div className="space-y-4">
                    <SettingsRow icon={Key} title="Password" description="Last changed 30 days ago" action={<Button variant="outline" size="sm">Change</Button>} />
                    <SettingsRow icon={Smartphone} title="Two-Factor Authentication" description="Add an extra layer of security" action={<Button variant="outline" size="sm">Enable</Button>} />
                    <SettingsRow icon={Shield} title="Active Sessions" description="Manage devices where you're logged in" action={<Button variant="ghost" size="sm">View All</Button>} />
                </div>
            </motion.div>
        </div>
    )
}
