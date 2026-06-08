/**
 * People Module Placeholder
 */

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

export default function PeoplePlaceholder() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-text-primary">People</h1>
        <p className="text-text-secondary">
          Manage staff, parents, departments, and communications.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-[rgb(var(--action-primary-bg))]/10 border border-[rgb(var(--state-info-border)/0.35)] flex items-start gap-4"
      >
        <Users className="w-6 h-6 text-[rgb(var(--state-info-fg))] flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-[rgb(var(--state-info-fg))]  mb-1">
            People Federated Module
          </h4>
          <p className="text-[rgb(var(--state-info-fg))]  text-sm">
            This placeholder will be replaced with the People remote module containing
            Staff Management, Parent Portal, Departments, and Communications.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

