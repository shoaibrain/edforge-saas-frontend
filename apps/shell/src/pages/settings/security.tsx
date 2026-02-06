/**
 * Security Settings Page
 *
 * Manage account security settings including password, MFA, and sessions.
 * Integrated with backend Security API and Cognito.
 */

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Key,
  Monitor,
  RotateCcw,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import { TextField } from '@/components/forms/fields'
import { useAuthStore } from '@/stores/auth.store'
import {
  passwordChangeSchema,
  type PasswordChangeFormValues,
} from '@/schemas/person.schema'
import {
  SettingsPageHeader,
  SettingsRow,
  SettingsSkeleton,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { usersService, type SecurityOverview } from '@/services/users.service'

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================

function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
    if (score <= 5) return { score: 3, label: 'Good', color: 'bg-emerald-500' }
    return { score: 4, label: 'Strong', color: 'bg-teal-500' }
  }

  const strength = getStrength(password)

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength.score ? strength.color : 'bg-[rgb(var(--surface-tertiary))]'
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${
          strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-500' : 'text-emerald-500'
        }`}
      >
        {strength.label}
      </p>
    </div>
  )
}

// ============================================================================
// PASSWORD CHANGE MODAL
// ============================================================================

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function PasswordChangeModal({ isOpen, onClose, onSuccess }: PasswordChangeModalProps) {
  const user = useAuthStore((s) => s.user)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const methods = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const {
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods
  const newPassword = watch('newPassword')

  const changeMutation = useMutation({
    mutationFn: (data: PasswordChangeFormValues) =>
      usersService.changePassword(user!.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      reset()
      onSuccess()
      onClose()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    },
  })

  const onSubmit = async (data: PasswordChangeFormValues) => {
    try {
      await changeMutation.mutateAsync(data)
    } catch {
      // Error handled via toast
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-xl"
        >
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">Change Password</h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-6">
            Enter your current password and choose a new one
          </p>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <TextField
                  name="currentPassword"
                  label="Current Password"
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-8 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
                >
                  {showPasswords.current ? (
                    <span className="text-xs font-semibold">Hide</span>
                  ) : (
                    <span className="text-xs font-semibold">Show</span>
                  )}
                </button>
              </div>

              <div className="relative">
                <TextField
                  name="newPassword"
                  label="New Password"
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-8 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
                >
                  {showPasswords.new ? (
                    <span className="text-xs font-semibold">Hide</span>
                  ) : (
                    <span className="text-xs font-semibold">Show</span>
                  )}
                </button>
                <PasswordStrengthIndicator password={newPassword || ''} />
              </div>

              <div className="relative">
                <TextField
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-8 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
                >
                  {showPasswords.confirm ? (
                    <span className="text-xs font-semibold">Hide</span>
                  ) : (
                    <span className="text-xs font-semibold">Show</span>
                  )}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// SECURITY OVERVIEW CARD
// ============================================================================

type StatusTone = 'good' | 'warn' | 'neutral'

const STATUS_DOT: Record<StatusTone, string> = {
  good: 'bg-emerald-500',
  warn: 'bg-amber-500',
  neutral: 'bg-[rgb(var(--text-tertiary))]',
}

function StatusItem({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: StatusTone
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[tone]}`} />
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-[rgb(var(--text-primary))]">{label}</span>
        <span className="text-[rgb(var(--text-secondary))]">{value}</span>
      </div>
    </div>
  )
}

function getPasswordLastChangedText(passwordLastChanged?: string | null): string {
  if (!passwordLastChanged) return 'Never changed'
  const daysSince = Math.floor((Date.now() - new Date(passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince === 0) return 'Changed today'
  if (daysSince === 1) return 'Changed yesterday'
  return `Changed ${daysSince} days ago`
}

function SecurityOverviewCard({
  overview,
  onRetry,
}: {
  overview?: SecurityOverview
  onRetry: () => void
}) {
  if (!overview) {
    return (
      <motion.div
        variants={fadeInUp}
        className="p-5 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Security Overview</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Unable to load security overview.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </motion.div>
    )
  }

  const daysSincePasswordChange = overview.passwordLastChanged
    ? Math.floor((Date.now() - new Date(overview.passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const passwordTone = daysSincePasswordChange !== null && daysSincePasswordChange < 90 ? 'good' : 'warn'
  const passwordText = getPasswordLastChangedText(overview.passwordLastChanged)

  return (
    <motion.div
      variants={fadeInUp}
      className="p-5 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Security Overview</h2>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          Quick summary of your account security.
        </p>
      </div>

      <div className="space-y-2">
        <StatusItem label="Password" value={passwordText} tone={passwordTone} />
        <StatusItem label="Two-Factor" value={overview.mfaEnabled ? 'Enabled' : 'Not enabled'} tone={overview.mfaEnabled ? 'good' : 'warn'} />
        <StatusItem
          label="Sessions"
          value={`${overview.activeSessions} active session${overview.activeSessions === 1 ? '' : 's'}`}
          tone="neutral"
        />
      </div>

      {overview.recommendations?.length > 0 && (
        <div className="pt-2 border-t border-[rgb(var(--border-secondary))]">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-semibold">Recommendations</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--text-secondary))]">
            {overview.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// COMING SOON PANEL
// ============================================================================

interface ComingSoonPanelProps {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
  actionLabel?: string
}

function ComingSoonPanel({
  icon: Icon,
  title,
  description,
  features,
  actionLabel,
}: ComingSoonPanelProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center">
          <Icon className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] max-w-xl">
            {description}
          </p>
        </div>

        <div className="w-full max-w-xl space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-[rgb(var(--text-secondary))]">
              <Check className="w-4 h-4 text-teal-600 dark:text-cyan-400 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {actionLabel && (
          <Button
            type="button"
            variant="outline"
            disabled
            className="mt-2 cursor-not-allowed opacity-60"
          >
            {actionLabel}
          </Button>
        )}

        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          Coming in a future update
        </p>
      </div>
    </motion.div>
  )
}

// ============================================================================
// SECURITY TABS
// ============================================================================

type SecurityTab = 'password' | 'mfa' | 'sessions'

const SECURITY_TABS: Array<{ id: SecurityTab; label: string }> = [
  { id: 'password', label: 'Password' },
  { id: 'mfa', label: 'Two-Factor Auth' },
  { id: 'sessions', label: 'Sessions & Activity' },
]

function SecurityTabs({
  activeTab,
  onChange,
}: {
  activeTab: SecurityTab
  onChange: (tab: SecurityTab) => void
}) {
  return (
    <div className="border-b border-[rgb(var(--border-primary))] overflow-x-auto">
      <div className="flex gap-6 min-w-max">
        {SECURITY_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative py-3 px-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-teal-600 dark:text-cyan-400'
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="security-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [activeTab, setActiveTab] = useState<SecurityTab>('password')

  const {
    data: securityOverview,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useQuery<SecurityOverview>({
    queryKey: ['security', user?.id],
    queryFn: () => usersService.getSecurityOverview(user!.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  })

  const handlePasswordSuccess = () => {
    toast.success('Password changed successfully')
    refetchOverview()
  }

  if (isLoadingOverview) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={5} showHeader />
      </div>
    )
  }

  const showOverviewError = !securityOverview || isOverviewError

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="space-y-8">
        <SettingsPageHeader
          title="Security"
          description="Manage your account security and authentication"
        />

        <SecurityOverviewCard
          overview={showOverviewError ? undefined : securityOverview}
          onRetry={refetchOverview}
        />

        <div className="space-y-6">
          <SecurityTabs activeTab={activeTab} onChange={setActiveTab} />

          <AnimatePresence mode="wait">
            {activeTab === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <SettingsRow
                  icon={Key}
                  title="Password"
                  description={getPasswordLastChangedText(securityOverview?.passwordLastChanged)}
                  action={
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                      Change
                    </Button>
                  }
                />
              </motion.div>
            )}

            {activeTab === 'mfa' && (
              <motion.div
                key="mfa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ComingSoonPanel
                  icon={Shield}
                  title="Two-Factor Authentication"
                  description="Add an extra layer of security to your account. When enabled, you'll need your password plus a verification code from your authenticator app each time you sign in."
                  features={[
                    'Supports Google Authenticator, Authy, and more',
                    'Backup codes for account recovery',
                    'Required for sensitive operations',
                  ]}
                  actionLabel="Set Up Two-Factor Auth"
                />
              </motion.div>
            )}

            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ComingSoonPanel
                  icon={Monitor}
                  title="Session Management"
                  description="View and manage all devices where you're currently signed in. Revoke access to any session you don't recognize."
                  features={[
                    'See all active sessions and devices',
                    'Revoke individual or all sessions',
                    'View recent login history',
                  ]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  )
}
