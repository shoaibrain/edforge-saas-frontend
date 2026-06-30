/**
 * Security Settings Page
 *
 * Manage account security settings including password.
 * Integrated with backend Security API and Cognito.
 */

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Key,
  RotateCcw,
  X,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@edforge/i18n'
import { toast } from 'sonner'
import axios from 'axios'
import { Button, Modal, ModalFooter } from '@edforge/ui'
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
// PASSWORD REQUIREMENTS CHECKLIST
// ============================================================================

const PASSWORD_REQUIREMENTS = [
  { labelKey: 'security.passwordRequirements.minLength', test: (p: string) => p.length >= 8 },
  { labelKey: 'security.passwordRequirements.uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { labelKey: 'security.passwordRequirements.lowercase', test: (p: string) => /[a-z]/.test(p) },
  { labelKey: 'security.passwordRequirements.number', test: (p: string) => /[0-9]/.test(p) },
  { labelKey: 'security.passwordRequirements.special', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function PasswordRequirements({ password }: { password: string }) {
  const { t } = useTranslation('settings')
  if (!password) return null

  return (
    <div className="mt-3 space-y-1.5">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password)
        return (
          <div key={req.labelKey} className="flex items-center gap-2 text-xs">
            {met ? (
              <Check className="w-3.5 h-3.5 text-[rgb(var(--state-success-fg))]" />
            ) : (
              <X className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
            )}
            <span
              className={
                met
                  ? 'text-[rgb(var(--state-success-fg))] '
                  : 'text-[rgb(var(--text-tertiary))]'
              }
            >
              {t(req.labelKey)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { t } = useTranslation('settings')
  const getStrength = (pwd: string): { score: number; labelKey: string; color: string } => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { score: 1, labelKey: 'security.passwordStrength.weak', color: 'bg-[rgb(var(--state-danger-bg)/0.18)]0' }
    if (score <= 4) return { score: 2, labelKey: 'security.passwordStrength.fair', color: 'bg-amber-500' }
    if (score <= 5) return { score: 3, labelKey: 'security.passwordStrength.good', color: 'bg-[rgb(var(--state-success-fg))]' }
    return { score: 4, labelKey: 'security.passwordStrength.strong', color: 'bg-[rgb(var(--action-primary-bg))]' }
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
              level <= strength.score ? strength.color : 'bg-[rgb(var(--background-tertiary))]'
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${
          strength.score <= 1 ? 'text-[rgb(var(--state-danger-fg))]' : strength.score <= 2 ? 'text-amber-500' : 'text-[rgb(var(--state-success-fg))]'
        }`}
      >
        {t(strength.labelKey)}
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

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation('settings')
  const Icon = visible ? EyeOff : Eye
  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-0.5 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
      aria-label={visible ? t('security.hidePassword') : t('security.showPassword')}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function PasswordChangeModal({ isOpen, onClose, onSuccess }: PasswordChangeModalProps) {
  const { t } = useTranslation('settings')
  const user = useAuthStore((s) => s.user)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formError, setFormError] = useState<string | null>(null)

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

  // Clear inline error when the user edits any field
  const allFields = watch()
  useEffect(() => {
    if (formError) setFormError(null)
  }, [allFields.currentPassword, allFields.newPassword, allFields.confirmPassword]) // eslint-disable-line react-hooks/exhaustive-deps

  const changeMutation = useMutation({
    mutationFn: (data: PasswordChangeFormValues) =>
      usersService.changePassword(user!.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      setFormError(null)
      reset()
      onSuccess()
      onClose()
    },
    onError: (err) => {
      let message = t('security.passwordChangeFailed')
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>
        if (typeof data.message === 'string') {
          message = data.message
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      setFormError(message)
    },
  })

  const onSubmit = async (data: PasswordChangeFormValues) => {
    setFormError(null)
    try {
      await changeMutation.mutateAsync(data)
    } catch {
      // Error handled in onError callback
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setFormError(null)
    reset()
    setShowPasswords({ current: false, new: false, confirm: false })
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={t('security.changePassword')}
      description={t('security.changePasswordDescription')}
      size="md"
    >
      {/* Inline error banner */}
      {formError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-[rgb(var(--state-danger-bg)/0.18)]0/10 border border-[rgb(var(--state-danger-border)/0.35)]"
        >
          <AlertCircle className="w-4 h-4 text-[rgb(var(--state-danger-fg))] mt-0.5 flex-shrink-0" />
          <span className="text-sm text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">{formError}</span>
        </motion.div>
      )}

      <FormProvider {...methods}>
        <form id="password-change-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <TextField
            name="currentPassword"
            label={t('security.currentPassword')}
            type={showPasswords.current ? 'text' : 'password'}
            placeholder={t('security.currentPasswordPlaceholder')}
            suffix={
              <PasswordVisibilityToggle
                visible={showPasswords.current}
                onToggle={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
              />
            }
          />

          <div>
            <TextField
              name="newPassword"
              label={t('security.newPassword')}
              type={showPasswords.new ? 'text' : 'password'}
              placeholder={t('security.newPasswordPlaceholder')}
              suffix={
                <PasswordVisibilityToggle
                  visible={showPasswords.new}
                  onToggle={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                />
              }
            />
            <PasswordStrengthIndicator password={newPassword || ''} />
            <PasswordRequirements password={newPassword || ''} />
          </div>

          <TextField
            name="confirmPassword"
            label={t('security.confirmPassword')}
            type={showPasswords.confirm ? 'text' : 'password'}
            placeholder={t('security.confirmPasswordPlaceholder')}
            suffix={
              <PasswordVisibilityToggle
                visible={showPasswords.confirm}
                onToggle={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
              />
            }
          />
        </form>
      </FormProvider>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          form="password-change-form"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {t('security.changePassword')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ============================================================================
// SECURITY OVERVIEW CARD
// ============================================================================

type StatusTone = 'good' | 'warn' | 'neutral'

const STATUS_DOT: Record<StatusTone, string> = {
  good: 'bg-[rgb(var(--state-success-fg))]',
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

function getPasswordLastChangedText(
  passwordLastChanged: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!passwordLastChanged) return t('security.passwordLastChanged.never')
  const daysSince = Math.floor((Date.now() - new Date(passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince === 0) return t('security.passwordLastChanged.today')
  if (daysSince === 1) return t('security.passwordLastChanged.yesterday')
  return t('security.passwordLastChanged.daysAgo', { count: daysSince })
}

function SecurityOverviewCard({
  overview,
  onRetry,
}: {
  overview?: SecurityOverview
  onRetry: () => void
}) {
  const { t } = useTranslation('settings')
  if (!overview) {
    return (
      <motion.div
        variants={fadeInUp}
        className="p-5 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('security.overview.title')}</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {t('security.overview.loadFailed')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('common.retry')}
          </Button>
        </div>
      </motion.div>
    )
  }

  const daysSincePasswordChange = overview.passwordLastChanged
    ? Math.floor((Date.now() - new Date(overview.passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const passwordTone = daysSincePasswordChange !== null && daysSincePasswordChange < 90 ? 'good' : 'warn'
  const passwordText = getPasswordLastChangedText(overview.passwordLastChanged, t)

  return (
    <motion.div
      variants={fadeInUp}
      className="p-5 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] space-y-4"
    >
      <div>
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('security.overview.title')}</h2>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {t('security.overview.description')}
        </p>
      </div>

      <div className="space-y-2">
        <StatusItem label={t('security.password')} value={passwordText} tone={passwordTone} />
        <StatusItem
          label={t('security.sessions')}
          value={t('security.activeSessionsCount', { count: overview.activeSessions })}
          tone="neutral"
        />
      </div>

      {/* Filter out recommendations for unreleased features (2FA/MFA) */}
      {(() => {
        const filteredRecs = overview.recommendations?.filter(
          (rec) => !/two.?factor|2fa|mfa/i.test(rec)
        ) ?? []
        return filteredRecs.length > 0 ? (
          <div className="pt-2 border-t border-[rgb(var(--border-secondary))]">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('security.recommendations')}</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--text-secondary))]">
              {filteredRecs.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500">&bull;</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      })()}
    </motion.div>
  )
}

// ============================================================================
// SECURITY TABS
// ============================================================================

type SecurityTab = 'password'

const SECURITY_TABS: Array<{ id: SecurityTab; labelKey: string }> = [
  { id: 'password', labelKey: 'security.password' },
]

function SecurityTabs({
  activeTab,
  onChange,
}: {
  activeTab: SecurityTab
  onChange: (tab: SecurityTab) => void
}) {
  const { t } = useTranslation('settings')
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
                  ? 'text-[rgb(var(--action-secondary-fg))] '
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }`}
            >
              {t(tab.labelKey)}
              {isActive && (
                <motion.div
                  layoutId="security-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--action-primary-bg))]"
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
  const { t } = useTranslation('settings')
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
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
    toast.success(t('security.passwordChanged'))

    // Optimistic update — show "Changed today" immediately even if
    // backend is slow to update the passwordLastChanged timestamp.
    queryClient.setQueryData<SecurityOverview>(['security', user?.id], (old) =>
      old
        ? { ...old, passwordLastChanged: new Date().toISOString() }
        : old
    )

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
          title={t('security.title')}
          description={t('security.description')}
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
                  title={t('security.password')}
                  description={getPasswordLastChangedText(securityOverview?.passwordLastChanged, t)}
                  action={
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                      {t('common.change')}
                    </Button>
                  }
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
