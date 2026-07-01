/**
 * Finance Module Placeholder
 */

import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

export default function FinancePlaceholder() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-text-primary">Finance</h1>
        <p className="text-text-secondary">
          Manage billing, payroll, expenses, and financial reports.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-golden-500/10 border border-golden-500/20 flex items-start gap-4"
      >
        <Wallet className="w-6 h-6 text-golden-500 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-golden-600 dark:text-golden-400 mb-1">
            Finance Federated Module
          </h4>
          <p className="text-golden-700 dark:text-golden-300 text-sm">
            This placeholder will be replaced with the Finance remote module containing
            Billing, Payroll, Tuition, Expenses, and Financial Analytics.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

