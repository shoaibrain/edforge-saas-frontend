import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useAuthStore, mockUserOptions } from '@/stores/auth.store'
import { motion } from 'framer-motion'
import { 
  LogIn, 
  Building2, 
  Shield,
  GraduationCap,
  UserCog,
  Baby,
  Briefcase,
  type LucideIcon,
} from 'lucide-react'
import type { RoleCategory } from '@/types/auth'

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

// ============================================================================
// ROLE CATEGORY STYLING
// Visual differentiation for different user types
// ============================================================================

interface RoleCategoryStyle {
  icon: LucideIcon
  bgColor: string
  iconColor: string
  badgeColor: string
  badgeText: string
}

const ROLE_CATEGORY_STYLES: Record<RoleCategory, RoleCategoryStyle> = {
  administrator: {
    icon: UserCog,
    bgColor: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-300',
    badgeText: 'text-teal-400',
  },
  educator: {
    icon: GraduationCap,
    bgColor: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    badgeText: 'text-amber-400',
  },
  student: {
    icon: Briefcase,
    bgColor: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
    badgeColor: 'bg-sky-500/20 text-sky-300',
    badgeText: 'text-sky-400',
  },
  parent: {
    icon: Baby,
    bgColor: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-300',
    badgeText: 'text-rose-400',
  },
}

/**
 * Get display label for role category
 */
function getRoleCategoryLabel(category: RoleCategory): string {
  switch (category) {
    case 'administrator':
      return 'Admin'
    case 'educator':
      return 'Teacher'
    case 'student':
      return 'Student'
    case 'parent':
      return 'Parent'
  }
}

// ============================================================================
// LOGIN PAGE COMPONENT
// ============================================================================

function LoginPage() {
  const navigate = useNavigate()
  const loginAs = useAuthStore((s) => s.loginAs)

  const handleLogin = (userId: string) => {
    // Type-safe login with all mock user IDs
    loginAs(userId as 'tenant-admin' | 'principal' | 'teacher' | 'accountant' | 'student' | 'parent')
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
        className="relative w-full max-w-lg"
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

          {/* User Options Grid - 2 columns for better layout with 6 users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockUserOptions.map((user, index) => {
              const style = ROLE_CATEGORY_STYLES[user.roleCategory]
              const RoleIcon = style.icon
              const categoryLabel = getRoleCategoryLabel(user.roleCategory)
              
              return (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  onClick={() => handleLogin(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/50 transition-all duration-200 group text-left"
                >
                  {/* Role-specific icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.bgColor} flex items-center justify-center`}>
                    <RoleIcon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-brand-300 transition-colors truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Role category badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.badgeColor}`}>
                        {categoryLabel}
                      </span>
                      {/* School count */}
                      <span className="text-[10px] text-slate-500">
                        {user.schoolCount} school{user.schoolCount !== 1 ? 's' : ''}
                      </span>
                      {/* Children count for parents */}
                      {user.childrenCount > 0 && (
                        <span className="text-[10px] text-rose-400/70">
                          {user.childrenCount} child{user.childrenCount !== 1 ? 'ren' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Login arrow */}
                  <LogIn className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                </motion.button>
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">User Types</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ROLE_CATEGORY_STYLES).map(([category, style]) => {
                const RoleIcon = style.icon
                return (
                  <div key={category} className="flex items-center gap-1.5">
                    <RoleIcon className={`w-3 h-3 ${style.iconColor}`} />
                    <span className={`text-[10px] ${style.badgeText}`}>
                      {getRoleCategoryLabel(category as RoleCategory)}
                    </span>
                  </div>
                )
              })}
            </div>
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
