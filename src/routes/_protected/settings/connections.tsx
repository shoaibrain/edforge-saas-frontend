
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Link2 } from 'lucide-react'

export const Route = createFileRoute('/_protected/settings/connections')({
    component: ConnectionsPage,
})

function ConnectionsPage() {
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
                    <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Connections</h1>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                        Apps and services connected to your account
                    </p>
                </div>

                <div className="text-center py-12 text-[rgb(var(--text-tertiary))]">
                    <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No connected apps</p>
                    <p className="text-sm mt-1">Connect apps to enhance your experience</p>
                </div>
            </motion.div>
        </div>
    )
}
