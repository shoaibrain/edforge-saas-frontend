import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'

export interface BootstrapPageProps {
  title: string
  description?: string
  icon: LucideIcon
  requiresActiveSchool?: boolean
  children?: ReactNode
}

export function BootstrapPage({
  title,
  description,
  icon: Icon,
  requiresActiveSchool = false,
  children,
}: BootstrapPageProps) {
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const user = useAuthStore((s) => s.user)

  const showSchoolRequiredState = requiresActiveSchool && !activeSchoolId

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-1 text-[rgb(var(--text-secondary))]"
          >
            {description}
          </motion.p>
        )}
      </div>

      {showSchoolRequiredState ? (
        <Card className="p-6">
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            Select a school to continue.
          </p>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))]">
              <Icon className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                Bootstrap page
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--text-tertiary))]">
                This route is scaffolded so navigation is complete. Feature implementation will be added incrementally.
              </p>
              {user?.globalRole && (
                <p className="mt-3 text-xs text-[rgb(var(--text-tertiary))]">
                  Signed in as <span className="font-medium text-[rgb(var(--text-secondary))]">{user.globalRole}</span>
                </p>
              )}
              {children ? <div className="mt-6">{children}</div> : null}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
