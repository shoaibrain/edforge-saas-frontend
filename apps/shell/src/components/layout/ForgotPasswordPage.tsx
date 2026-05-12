/**
 * Forgot Password Page
 *
 * In-app two-step password reset using Cognito's ForgotPassword API
 * via Amplify v6 resetPassword / confirmResetPassword. Coexists with the
 * NEW_PASSWORD_REQUIRED first-login flow (handled on LoginPage).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2, AlertCircle, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@edforge/ui'
import { forgotPassword, confirmForgotPassword } from '@edforge/auth'
import { useTranslation } from '@edforge/i18n'

type Step = 'request-code' | 'confirm-reset'

const PASSWORD_RULES = [
  { key: 'len', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit', label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function passwordMeetsPolicy(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p))
}

function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      {PASSWORD_RULES.map((r) => {
        const met = r.test(password)
        return (
          <div key={r.key} className="flex items-center gap-2 text-xs">
            {met ? (
              <Check className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
            ) : (
              <X className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
            )}
            <span style={{ color: met ? '#059669' : '#94A3B8' }}>{r.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('auth')

  const [step, setStep] = useState<Step>('request-code')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const mapAmplifyError = (err: unknown): string => {
    const message = err instanceof Error ? err.message : ''
    const name = (err as { name?: string })?.name ?? ''
    if (name === 'LimitExceededException' || message.includes('LimitExceededException')) {
      return t('tooManyAttempts', 'Too many attempts. Please try again later.')
    }
    if (name === 'CodeMismatchException' || message.includes('CodeMismatchException')) {
      return t('invalidCode', 'Invalid verification code. Please check and try again.')
    }
    if (name === 'ExpiredCodeException' || message.includes('ExpiredCodeException')) {
      return t('codeExpired', 'Verification code expired. Request a new one.')
    }
    if (name === 'InvalidPasswordException' || message.includes('InvalidPasswordException')) {
      return t('invalidPasswordPolicy', 'New password does not meet requirements.')
    }
    if (name === 'InvalidParameterException' || message.includes('InvalidParameterException')) {
      return t('forgotPasswordGenericError', 'Something went wrong. Please try again.')
    }
    return t('forgotPasswordGenericError', 'Something went wrong. Please try again.')
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)
    setInfo(null)

    try {
      await forgotPassword(email.trim())
      setStep('confirm-reset')
    } catch (err) {
      const name = (err as { name?: string })?.name ?? ''
      const message = err instanceof Error ? err.message : ''
      // Mask account existence: UserNotFoundException is silently treated as
      // success so we never reveal whether an email is registered.
      if (
        name === 'UserNotFoundException' ||
        message.includes('UserNotFoundException')
      ) {
        setStep('confirm-reset')
      } else if (
        name === 'LimitExceededException' ||
        message.includes('LimitExceededException')
      ) {
        setError(t('tooManyAttempts', 'Too many attempts. Please try again later.'))
      } else {
        setError(mapAmplifyError(err))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email.trim() || isResending) return
    setIsResending(true)
    setError(null)
    setInfo(null)
    try {
      await forgotPassword(email.trim())
      setInfo(t('codeResent', 'A new verification code was sent.'))
    } catch (err) {
      const name = (err as { name?: string })?.name ?? ''
      const message = err instanceof Error ? err.message : ''
      if (
        name === 'UserNotFoundException' ||
        message.includes('UserNotFoundException')
      ) {
        // Same masking — pretend it succeeded.
        setInfo(t('codeResent', 'A new verification code was sent.'))
      } else {
        setError(mapAmplifyError(err))
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch', 'Passwords do not match.'))
      return
    }
    if (!passwordMeetsPolicy(newPassword)) {
      setError(t('invalidPasswordPolicy', 'New password does not meet requirements.'))
      return
    }

    setIsLoading(true)
    try {
      await confirmForgotPassword(email.trim(), code.trim(), newPassword)
      toast.success(
        t(
          'passwordResetSuccess',
          'Password reset successful. Please sign in with your new password.',
        ),
      )
      navigate({ to: '/login', replace: true })
    } catch (err) {
      setError(mapAmplifyError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="ghost" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/logo.svg"
                alt="EdForge"
                className="w-9 h-9 object-contain transition-transform group-hover:scale-105"
              />
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ color: '#1E293B', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}
              >
                EdForge
              </span>
            </Link>
          </div>

          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <AnimatePresence mode="wait">
              {step === 'request-code' && (
                <motion.div
                  key="request-code"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-semibold mb-1" style={{ color: '#1E293B' }}>
                    {t('forgotPasswordHeading', 'Reset your password')}
                  </h1>
                  <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                    {t(
                      'forgotPasswordSubheading',
                      "Enter the email address on your account and we'll send you a verification code.",
                    )}
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 p-3 mb-5 rounded-xl"
                      style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                    >
                      <AlertCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: '#EF4444' }}
                      />
                      <span className="text-sm" style={{ color: '#DC2626' }}>{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: '#374151' }}
                      >
                        {t('email', 'Email')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.edu"
                        autoComplete="email"
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-colors"
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#1E293B',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#F97316'
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                      style={{
                        backgroundColor: '#F97316',
                        color: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(249,115,22,0.3)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('sendingCode', 'Sending code...')}
                        </>
                      ) : (
                        t('sendCode', 'Send code')
                      )}
                    </button>
                  </form>

                  <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
                    <Link
                      to="/login"
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: '#F97316' }}
                    >
                      {t('backToSignIn', 'Back to sign in')}
                    </Link>
                  </p>
                </motion.div>
              )}

              {step === 'confirm-reset' && (
                <motion.div
                  key="confirm-reset"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-semibold mb-1" style={{ color: '#1E293B' }}>
                    {t('verificationCodeHeading', 'Enter verification code')}
                  </h1>
                  <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                    {t('verificationCodeSubheading', {
                      defaultValue:
                        "If an account exists for {{email}}, we've sent a 6-digit code. Enter it below along with your new password.",
                      email: email.trim(),
                    })}
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 p-3 mb-5 rounded-xl"
                      style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                    >
                      <AlertCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: '#EF4444' }}
                      />
                      <span className="text-sm" style={{ color: '#DC2626' }}>{error}</span>
                    </motion.div>
                  )}

                  {info && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 p-3 mb-5 rounded-xl"
                      style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}
                    >
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: '#10B981' }}
                      />
                      <span className="text-sm" style={{ color: '#047857' }}>{info}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleConfirmReset} className="space-y-4">
                    <div>
                      <label
                        htmlFor="code"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: '#374151' }}
                      >
                        {t('verificationCode', 'Verification code')}
                      </label>
                      <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-colors tracking-widest"
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#1E293B',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#F97316'
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: '#374151' }}
                      >
                        {t('newPassword', 'New password')}
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl outline-none transition-colors"
                          style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#1E293B',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#F97316'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#E2E8F0'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors hover:bg-gray-100"
                          style={{ color: '#94A3B8' }}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordChecklist password={newPassword} />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: '#374151' }}
                      >
                        {t('confirmPassword', 'Confirm password')}
                      </label>
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-colors"
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#1E293B',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#F97316'
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        !code.trim() ||
                        !passwordMeetsPolicy(newPassword) ||
                        newPassword !== confirmPassword
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                      style={{
                        backgroundColor: '#F97316',
                        color: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(249,115,22,0.3)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('resettingPassword', 'Resetting password...')}
                        </>
                      ) : (
                        t('resetPasswordCta', 'Reset password')
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-between mt-6 text-sm">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="font-semibold transition-colors hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: '#F97316' }}
                    >
                      {isResending
                        ? t('resendingCode', 'Resending...')
                        : t('resendCode', 'Resend code')}
                    </button>
                    <Link
                      to="/login"
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: '#F97316' }}
                    >
                      {t('backToSignIn', 'Back to sign in')}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mt-6 space-y-2">
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {t('secureAuth')}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/privacy"
                className="text-xs transition-colors hover:underline"
                style={{ color: '#94A3B8' }}
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-xs transition-colors hover:underline"
                style={{ color: '#94A3B8' }}
              >
                Terms
              </Link>
              <Link
                to="/security"
                className="text-xs transition-colors hover:underline"
                style={{ color: '#94A3B8' }}
              >
                Security
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
