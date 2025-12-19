
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Webhook } from 'lucide-react'

export const Route = createFileRoute('/_protected/messages/integrations')({
    component: IntegrationsPage,
})

function IntegrationsPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Integrations</h1>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Connect your favorite communication tools
                    </p>
                </div>

                <div className="text-center py-20 bg-[rgb(var(--surface-secondary))] rounded-2xl border border-[rgb(var(--border-primary))] border-dashed">
                    <Webhook className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-50" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Integration Store</h2>
                    <p className="text-[rgb(var(--text-tertiary))] max-w-sm mx-auto mt-2">
                        Browse and connect 3rd party apps like Slack, Microsoft Teams, and Google Meet.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
