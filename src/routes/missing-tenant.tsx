import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Building2, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/missing-tenant')({
  component: MissingTenantPage,
})

function MissingTenantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex items-center justify-center p-4">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-6"
        >
          <Building2 className="w-10 h-10 text-amber-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Tenant Not Found
        </h1>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-300 text-sm mb-3">
                Edforge EMIS requires a valid tenant subdomain to access the application.
              </p>
              <p className="text-slate-400 text-sm">
                Please ensure you're accessing the application via a valid URL like:
              </p>
              <code className="block mt-2 px-3 py-2 rounded-lg bg-slate-800/50 text-brand-300 text-sm font-mono">
                tenant-name.edforge.com
              </code>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm">
          If you believe this is an error, please contact your administrator.
        </p>
      </motion.div>
    </div>
  )
}

