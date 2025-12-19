
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/_protected/messages/meetings')({
    component: MeetingsPage,
})

function MeetingsPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Meetings</h1>
                        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                            Schedule and manage your video conferences
                        </p>
                    </div>
                    <Button>Schedule Meeting</Button>
                </div>

                <div className="text-center py-20 bg-[rgb(var(--surface-secondary))] rounded-2xl border border-[rgb(var(--border-primary))] border-dashed">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-50" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">No Upcoming Meetings</h2>
                    <p className="text-[rgb(var(--text-tertiary))] max-w-sm mx-auto mt-2">
                        You don't have any scheduled meetings. Create one to get started.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
