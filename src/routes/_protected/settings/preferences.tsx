
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { SettingsCard } from '@/components/settings/SettingsShared'

export const Route = createFileRoute('/_protected/settings/preferences')({
    component: PreferencesPage,
})

function PreferencesPage() {
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
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Preferences</h1>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Customize your display and language settings
                    </p>
                </div>

                <div className="space-y-4">
                    <SettingsCard title="Language" description="Select your preferred language">
                        <select className="px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                            <option>English (US)</option>
                            <option>Spanish</option>
                            <option>French</option>
                        </select>
                    </SettingsCard>

                    <SettingsCard title="Timezone" description="Set your local timezone">
                        <select className="px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                            <option>Pacific Time (PT)</option>
                            <option>Mountain Time (MT)</option>
                            <option>Central Time (CT)</option>
                            <option>Eastern Time (ET)</option>
                        </select>
                    </SettingsCard>

                    <SettingsCard title="Date Format" description="Choose how dates are displayed">
                        <select className="px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                        </select>
                    </SettingsCard>
                </div>
            </motion.div>
        </div>
    )
}
