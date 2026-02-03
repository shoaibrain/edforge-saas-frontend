/**
 * BootstrapPage - Scaffolded page placeholder with contextual messaging
 * 
 * Used for routes that are scaffolded but not yet fully implemented.
 * Provides:
 * - Module-contextual messaging
 * - Feature roadmap hints
 * - School selection state
 * - Consistent theming with subtle gradient backgrounds
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Building2, Sparkles, Clock, CheckCircle2 } from 'lucide-react'
import { Card } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FeatureHint {
  label: string
  status: 'planned' | 'in-progress' | 'coming-soon'
}

export interface BootstrapPageProps {
  title: string
  description?: string
  icon: LucideIcon
  requiresActiveSchool?: boolean
  featureHints?: FeatureHint[]
  children?: ReactNode
}

// ============================================================================
// FEATURE STATUS BADGE
// ============================================================================

function FeatureStatusBadge({ status }: { status: FeatureHint['status'] }) {
  const statusConfig = {
    'planned': {
      bg: 'bg-[rgb(var(--surface-tertiary))]',
      text: 'text-[rgb(var(--text-tertiary))]',
      icon: Clock,
      label: 'Planned',
    },
    'in-progress': {
      bg: 'bg-golden-400/20',
      text: 'text-golden-600 dark:text-golden-400',
      icon: Sparkles,
      label: 'In Progress',
    },
    'coming-soon': {
      bg: 'bg-teal-500/15 dark:bg-cyan-500/20',
      text: 'text-teal-600 dark:text-cyan-400',
      icon: CheckCircle2,
      label: 'Coming Soon',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ============================================================================
// SCHOOL REQUIRED STATE
// ============================================================================

function SchoolRequiredState() {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="p-8 relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-golden-400/5 via-transparent to-caramel-400/5 dark:from-golden-400/10 dark:to-caramel-400/10" />
        
        <div className="relative flex flex-col items-center text-center gap-4">
          <div className="p-4 rounded-2xl bg-golden-400/20 dark:bg-golden-400/25">
            <Building2 className="w-8 h-8 text-golden-600 dark:text-golden-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
              Select a School
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-md">
              Choose a school from the header to access this feature. 
              This ensures data is properly scoped to your institution.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BootstrapPage({
  title,
  description,
  icon: Icon,
  requiresActiveSchool = false,
  featureHints,
  children,
}: BootstrapPageProps) {
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const user = useAuthStore((s) => s.user)

  const showSchoolRequiredState = requiresActiveSchool && !activeSchoolId

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SchoolRequiredState />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/3 via-transparent to-cyan-500/3 dark:from-teal-500/8 dark:to-cyan-500/8" />
            
            <div className="relative p-8">
              <div className="flex items-start gap-5">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/15 border border-teal-500/20 dark:border-cyan-500/25 flex-shrink-0">
                  <Icon className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">
                        Feature Coming Soon
                      </h2>
                      <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-lg">
                        This module is scaffolded and ready for development. 
                        Navigation and routing are complete—feature implementation 
                        will be added incrementally.
                      </p>
                    </div>
                    {user?.globalRole && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))] text-xs font-medium text-[rgb(var(--text-secondary))]">
                          Signed in as {user.globalRole}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feature hints */}
                  {featureHints && featureHints.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[rgb(var(--border-secondary))]">
                      <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">
                        Planned Features
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {featureHints.map((hint, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))]"
                          >
                            <span className="text-sm text-[rgb(var(--text-primary))]">
                              {hint.label}
                            </span>
                            <FeatureStatusBadge status={hint.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom children content */}
                  {children && (
                    <div className="mt-6 pt-6 border-t border-[rgb(var(--border-secondary))]">
                      {children}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

