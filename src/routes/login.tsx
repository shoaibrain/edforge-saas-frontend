import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useAuthStore, mockUserOptions } from '@/stores/auth.store'
import { motion } from 'framer-motion'
import { LogIn, User, Building2, Shield } from 'lucide-react'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    // Redirect to dashboard if already authenticated
    const { token, user } = useAuthStore.getState()
    if (token && user) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const loginAs = useAuthStore((s) => s.loginAs)

  const handleLogin = (userId: string) => {
    loginAs(userId as 'tenant-admin' | 'principal' | 'teacher' | 'accountant')
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 flex items-center justify-center p-4">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30 mb-4"
          >
            <Building2 className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Edforge EMIS</h1>
          <p className="text-slate-400">Education Management Information System</p>
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
            <Shield className="w-5 h-5 text-brand-400" />
            <span className="text-sm text-slate-300">Mock Authentication</span>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            Select a user profile to sign in. Each profile has different permissions
            across schools.
          </p>

          <div className="space-y-3">
            {mockUserOptions.map((user, index) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => handleLogin(user.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/50 transition-all duration-200 group text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white group-hover:text-brand-300 transition-colors">
                    {user.name}
                  </div>
                  <div className="text-sm text-slate-400 truncate">{user.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                      {user.globalRole}
                    </span>
                    <span className="text-xs text-slate-500">
                      {user.schoolCount} school{user.schoolCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <LogIn className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Phase 1 Development Build
        </p>
      </motion.div>
    </div>
  )
}
