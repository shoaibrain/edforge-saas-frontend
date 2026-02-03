/**
 * Danger Zone Settings Page
 * 
 * Destructive account actions like deactivation and deletion.
 */

import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Button } from '@edforge/ui'

export default function DangerZonePage() {
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
          <h1 className="text-2xl font-bold text-rust-600 dark:text-rust-400">Danger Zone</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Irreversible actions that affect your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-rust-500/5 border border-rust-500/20">
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Deactivate Account</h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
              Temporarily disable your account. You can reactivate it anytime.
            </p>
            <Button variant="outline" className="border-rust-500/30 text-rust-600 hover:bg-rust-500/10">
              Deactivate
            </Button>
          </div>

          <div className="p-6 rounded-xl bg-rust-500/5 border border-rust-500/20">
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Delete Account</h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <Button variant="outline" className="border-rust-500/30 text-rust-600 hover:bg-rust-500/10">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
