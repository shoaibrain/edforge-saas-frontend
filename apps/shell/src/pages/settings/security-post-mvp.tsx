/**
 * Post-MVP security components.
 * Import back into security.tsx when backend support is ready.
 */

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  LogOut,
  MapPin,
  Monitor,
  QrCode,
  Shield,
  Smartphone,
  Tablet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@edforge/ui'
import { TextField } from '@/components/forms/fields'
import { useAuthStore } from '@/stores/auth.store'
import {
  mfaVerificationSchema,
  type MfaVerificationFormValues,
} from '@/schemas/person.schema'
import { SettingsAlert, fadeInUp } from '@/components/settings/SettingsShared'
import {
  usersService,
  type LoginHistoryEntry,
  type MfaSetupResponse,
  type UserSession,
} from '@/services/users.service'

// ============================================================================
// DEVICE ICON HELPER
// ============================================================================

export function getDeviceIcon(deviceType: UserSession['deviceType']) {
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
// MFA SETUP MODAL (Post-MVP)
// ============================================================================

export interface MfaSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MfaSetupModal({ isOpen, onClose, onSuccess }: MfaSetupModalProps) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const methods = useForm<MfaVerificationFormValues>({
    resolver: zodResolver(mfaVerificationSchema),
    defaultValues: { code: '' },
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods

  const setupMutation = useMutation({
    mutationFn: () => usersService.initiateMfaSetup(user!.id),
    onSuccess: (data) => {
      setSetupData(data)
      setStep('verify')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (data: MfaVerificationFormValues) => usersService.verifyAndEnableMfa(user!.id, data),
    onSuccess: (data: { success: boolean; backupCodes?: string[] }) => {
      if (data.backupCodes && data.backupCodes.length > 0 && setupData) {
        setSetupData({ ...setupData, backupCodes: data.backupCodes })
        setStep('backup')
      } else {
        onSuccess()
        handleClose()
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm"
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--action-primary-bg))]/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[rgb(var(--action-secondary-fg))] " />
                </div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Enable Two-Factor Authentication
                </h2>
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
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">
                Scan QR Code
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
                Scan this code with your authenticator app
              </p>

              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[rgb(var(--surface-secondary))] rounded-xl">
                  {setupData.qrCodeUrl ? (
                    <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-[rgb(var(--surface-tertiary))] rounded">
                      <QrCode className="w-16 h-16 text-[rgb(var(--text-tertiary))]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">
                  Or enter this code manually:
                </p>
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
                      <Check className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--state-success-bg)/0.18)] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[rgb(var(--state-success-fg))]" />
                </div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">2FA Enabled!</h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  Save these backup codes in a safe place
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="text-sm font-mono text-[rgb(var(--text-primary))] p-2 bg-[rgb(var(--surface-secondary))] rounded"
                    >
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

export interface SessionCardProps {
  session: UserSession
  onRevoke: (sessionId: string) => void
  isRevoking: boolean
}

export function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  const Icon = getDeviceIcon(session.deviceType)

  return (
    <motion.div
      variants={fadeInUp}
      className={`p-4 rounded-xl border transition-colors ${
        session.isCurrent
          ? 'bg-[rgb(var(--action-primary-bg))]/5 border-[rgb(var(--border-focus)/0.35)]'
          : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-[rgb(var(--action-primary-bg))]/10' : 'bg-[rgb(var(--surface-tertiary))]'}`}>
          <Icon className={`w-4 h-4 ${session.isCurrent ? 'text-[rgb(var(--action-secondary-fg))] ' : 'text-[rgb(var(--text-tertiary))]'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-[rgb(var(--text-primary))] truncate">
              {session.browser} on {session.os}
            </p>
            {session.isCurrent && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))] ">
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
            className="text-[rgb(var(--state-danger-fg))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10"
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

export interface LoginHistoryItemProps {
  entry: LoginHistoryEntry
}

export function LoginHistoryItem({ entry }: LoginHistoryItemProps) {
  const statusConfig: Record<
    LoginHistoryEntry['status'],
    { icon: LucideIcon; color: string; bg: string }
  > = {
    success: { icon: CheckCircle2, color: 'text-[rgb(var(--state-success-fg))]', bg: 'bg-[rgb(var(--state-success-bg)/0.18)]' },
    failed: { icon: XCircle, color: 'text-[rgb(var(--state-danger-fg))]', bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]0/10' },
    blocked: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  }

  const config = statusConfig[entry.status]
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
      {entry.failureReason && <span className="text-xs text-[rgb(var(--state-danger-fg))]">{entry.failureReason}</span>}
    </div>
  )
}
