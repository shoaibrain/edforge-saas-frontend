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
  Key, 
  Smartphone, 
  Shield, 
  Monitor,
  Tablet,
  Globe,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  Check,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@edforge/ui'
import { TextField } from '@/components/forms/fields'
import { useAuthStore } from '@/stores/auth.store'
import { 
  passwordChangeSchema, 
  mfaVerificationSchema,
  type PasswordChangeFormValues,
  type MfaVerificationFormValues,
} from '@/schemas/person.schema'
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsRow,
  SettingsAlert,
  SettingsSkeleton,
  // SettingsEmptyState, // Post-MVP: used for sessions
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { 
  usersService, 
  type SecurityOverview,
  // Post-MVP types
  // type UserSession,
  // type LoginHistoryEntry,
  // type MfaSetupResponse,
} from '@/services/users.service'

// ============================================================================
// DEVICE ICON HELPER (Post-MVP)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDeviceIcon(deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown') {
  switch (deviceType) {
    case 'desktop':
      return Monitor
    case 'mobile':
      return Smartphone
    case 'tablet':
      return Tablet
    default:
      return Globe
  }
}

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
      <p className={`text-xs ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
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

  const { handleSubmit, watch, reset, formState: { isSubmitting } } = methods
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
  })

  const onSubmit = async (data: PasswordChangeFormValues) => {
    await changeMutation.mutateAsync(data)
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
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {changeMutation.isError && (
                <SettingsAlert
                  type="error"
                  message={changeMutation.error instanceof Error ? changeMutation.error.message : 'Failed to change password'}
                />
              )}

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
// MFA SETUP MODAL (Post-MVP - Disabled until backend supports Access Token)
// ============================================================================

interface MfaSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MfaSetupModal({ isOpen, onClose, onSuccess }: MfaSetupModalProps) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [setupData, setSetupData] = useState<any>(null) // MfaSetupResponse - disabled for MVP
  const [copiedCode, setCopiedCode] = useState(false)

  const methods = useForm<MfaVerificationFormValues>({
    resolver: zodResolver(mfaVerificationSchema),
    defaultValues: { code: '' },
  })

  const { handleSubmit, reset, formState: { isSubmitting } } = methods

  // Initiate MFA setup
  const setupMutation = useMutation({
    mutationFn: () => usersService.initiateMfaSetup(user!.id),
    onSuccess: (data) => {
      setSetupData(data)
      setStep('verify')
    },
  })

  // Verify MFA code
  const verifyMutation = useMutation({
    mutationFn: (data: MfaVerificationFormValues) => 
      usersService.verifyAndEnableMfa(user!.id, data),
    onSuccess: (data: { success: boolean; backupCodes?: string[] }) => {
      if (data.backupCodes && data.backupCodes.length > 0) {
        setSetupData((prev: any) => prev ? { ...prev, backupCodes: data.backupCodes! } : prev)
        setStep('backup')
      } else {
        onSuccess()
        onClose()
      }
    },
  })

  const handleStartSetup = () => {
    setupMutation.mutate()
  }

  const onVerify = async (data: MfaVerificationFormValues) => {
    await verifyMutation.mutateAsync(data)
  }

  const handleCopySecret = async () => {
    if (setupData?.secretKey) {
      await navigator.clipboard.writeText(setupData.secretKey)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleClose = () => {
    setStep('setup')
    setSetupData(null)
    reset()
    onClose()
  }

  const handleComplete = () => {
    onSuccess()
    handleClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-xl"
        >
          {step === 'setup' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Enable Two-Factor Authentication</h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>

              <div className="space-y-3 mb-6 text-sm text-[rgb(var(--text-secondary))]">
                <p>1. Install an authenticator app (Google Authenticator, Authy, etc.)</p>
                <p>2. Scan the QR code with your authenticator app</p>
                <p>3. Enter the verification code to enable 2FA</p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleStartSetup} 
                  disabled={setupMutation.isPending}
                  className="flex-1"
                >
                  {setupMutation.isPending ? 'Setting up...' : 'Get Started'}
                </Button>
              </div>
            </>
          )}

          {step === 'verify' && setupData && (
            <>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">Scan QR Code</h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
                Scan this code with your authenticator app
              </p>

              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-xl">
                  {setupData.qrCodeUrl ? (
                    <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">Or enter this code manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-[rgb(var(--text-primary))] break-all">
                    {setupData.secretKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1.5 rounded hover:bg-[rgb(var(--surface-secondary))] transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    )}
                  </button>
                </div>
              </div>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onVerify)} className="space-y-4">
                  <TextField
                    name="code"
                    label="Verification Code"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />

                  {verifyMutation.isError && (
                    <SettingsAlert
                      type="error"
                      message={verifyMutation.error instanceof Error ? verifyMutation.error.message : 'Invalid code'}
                    />
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </>
          )}

          {step === 'backup' && setupData && (
            <>
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">2FA Enabled!</h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  Save these backup codes in a safe place
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code: string, i: number) => (
                    <code key={i} className="text-sm font-mono text-[rgb(var(--text-primary))] p-2 bg-[rgb(var(--surface-secondary))] rounded">
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[rgb(var(--text-tertiary))] mb-4">
                Each code can only be used once. Keep them safe!
              </p>

              <Button type="button" onClick={handleComplete} className="w-full">
                Done
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================================
// SESSION CARD (Post-MVP)
// ============================================================================

interface SessionCardProps {
  session: any // UserSession - disabled for MVP
  onRevoke: (sessionId: string) => void
  isRevoking: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  const Icon = getDeviceIcon(session.deviceType)
  
  return (
    <motion.div
      variants={fadeInUp}
      className={`
        p-4 rounded-xl border transition-colors
        ${session.isCurrent 
          ? 'bg-teal-500/5 border-teal-500/20' 
          : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))]'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-teal-500/10' : 'bg-[rgb(var(--surface-tertiary))]'}`}>
          <Icon className={`w-4 h-4 ${session.isCurrent ? 'text-teal-600 dark:text-cyan-400' : 'text-[rgb(var(--text-tertiary))]'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-[rgb(var(--text-primary))] truncate">
              {session.browser} on {session.os}
            </p>
            {session.isCurrent && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-500/10 text-teal-600 dark:text-cyan-400">
                Current
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-[rgb(var(--text-tertiary))]">
            {session.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {session.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(session.lastActivityAt).toLocaleString()}
            </span>
          </div>
        </div>

        {!session.isCurrent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRevoke(session.sessionId)}
            disabled={isRevoking}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// LOGIN HISTORY ITEM (Post-MVP)
// ============================================================================

interface LoginHistoryItemProps {
  entry: any // LoginHistoryEntry - disabled for MVP
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LoginHistoryItem({ entry }: LoginHistoryItemProps) {
  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    blocked: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  }

  const config = statusConfig[entry.status as string]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[rgb(var(--border-primary))] last:border-0">
      <div className={`p-1.5 rounded-lg ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[rgb(var(--text-primary))] truncate">{entry.deviceInfo}</p>
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          {entry.ipAddress} • {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>
      {entry.failureReason && (
        <span className="text-xs text-red-500">{entry.failureReason}</span>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SecurityPage() {
  const user = useAuthStore((s) => s.user)
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  // MFA modal disabled for MVP - const [showMfaModal, setShowMfaModal] = useState(false)
  
  // Alert states
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch security overview
  const {
    data: securityOverview,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
  } = useQuery<SecurityOverview>({
    queryKey: ['security', user?.id],
    queryFn: () => usersService.getSecurityOverview(user!.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  })

  // Post-MVP: Sessions and MFA queries/mutations disabled for MVP
  // These will be re-enabled when backend support is ready
  /*
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery<UserSession[]>({
    queryKey: ['sessions', user?.id],
    queryFn: () => usersService.getActiveSessions(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  })

  const {
    data: loginHistory,
    isLoading: isLoadingHistory,
  } = useQuery<LoginHistoryEntry[]>({
    queryKey: ['loginHistory', user?.id],
    queryFn: () => usersService.getLoginHistory(user!.id, 5),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  })

  const revokeSessionMutation = useMutation({...})
  const revokeAllMutation = useMutation({...})
  const disableMfaMutation = useMutation({...})
  */

  const handlePasswordSuccess = () => {
    setSuccessMessage('Password changed successfully')
    refetchOverview()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Post-MVP: MFA success handler disabled
  // const handleMfaSuccess = () => {
  //   setSuccessMessage('Two-factor authentication enabled')
  //   refetchOverview()
  //   setTimeout(() => setSuccessMessage(null), 3000)
  // }

  // Loading state
  if (isLoadingOverview) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={5} showHeader />
      </div>
    )
  }

  // Get password last changed text
  const getPasswordLastChanged = () => {
    if (!securityOverview?.passwordLastChanged) return 'Never changed'
    const days = Math.floor((Date.now() - new Date(securityOverview.passwordLastChanged).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Changed today'
    if (days === 1) return 'Changed yesterday'
    return `Changed ${days} days ago`
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Security"
          description="Manage your account security and authentication"
        />

        {/* Alerts */}
        <AnimatePresence>
          {successMessage && (
            <SettingsAlert
              type="success"
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
              autoDismiss
            />
          )}
          {errorMessage && (
            <SettingsAlert
              type="error"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}
        </AnimatePresence>

        {/* Security Score / Recommendations */}
        {securityOverview && securityOverview.recommendations.length > 0 && (
          <motion.div 
            variants={fadeInUp}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-[rgb(var(--text-primary))]">Security Recommendations</p>
                <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--text-secondary))]">
                  {securityOverview.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Password Section */}
        <SettingsSection
          title="Password"
          icon={Key}
          description="Manage your account password"
        >
          <SettingsRow
            icon={Key}
            title="Password"
            description={getPasswordLastChanged()}
            action={
              <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                Change
              </Button>
            }
          />
        </SettingsSection>

        {/* Two-Factor Authentication - Post-MVP */}
        <SettingsSection
          title="Two-Factor Authentication"
          icon={Smartphone}
          description="Add an extra layer of security"
        >
          <div className="p-4 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Coming Soon</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  Two-factor authentication will be available in a future update
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Active Sessions - Post-MVP */}
        <SettingsSection
          title="Active Sessions"
          icon={Monitor}
          description="Devices where you're currently logged in"
        >
          <div className="p-4 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Monitor className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Coming Soon</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  Session management will be available in a future update
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* Modals */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
      
      {/* Post-MVP: MFA Modal disabled */}
      {/* <MfaSetupModal
        isOpen={showMfaModal}
        onClose={() => setShowMfaModal(false)}
        onSuccess={handleMfaSuccess}
      /> */}
    </div>
  )
}
