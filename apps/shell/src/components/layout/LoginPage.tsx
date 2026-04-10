/**
 * Login Page
 *
 * Production authentication with embedded sign-in form.
 * Uses Cognito's direct signIn API (no hosted UI redirect).
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { LanguageSwitcher } from '@edforge/ui'
import { signInDirect, completeNewPassword, getForgotPasswordUrl } from '@edforge/auth'
import { useTranslation } from '@edforge/i18n'
import { useAuthStore } from '../../stores/auth.store'

type AuthView = 'signin' | 'force-new-password'

export function LoginPage() {
  const isStoreAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const { t } = useTranslation('auth')

  const [view, setView] = useState<AuthView>('signin')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Sign-in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Force new password fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isStoreAuthenticated) {
      navigate({ to: '/home', replace: true })
    }
  }, [isStoreAuthenticated, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setIsLoading(true)
    setError(null)

    // Clear session invalidation flag so auth can proceed
    sessionStorage.removeItem('edforge-session-invalidated')

    try {
      const result = await signInDirect(email.trim(), password)

      if (result.isSignedIn) {
        await useAuthStore.getState().initializeAuth()
        navigate({ to: '/home', replace: true })
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setView('force-new-password')
        setIsLoading(false)
      } else {
        setError(t('authFailed'))
        setIsLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('loginError')
      // Map Cognito error messages to user-friendly ones
      if (message.includes('NotAuthorizedException') || message.includes('Incorrect username or password')) {
        setError(t('invalidCredentials', 'Incorrect email or password.'))
      } else if (message.includes('UserNotFoundException')) {
        setError(t('invalidCredentials', 'Incorrect email or password.'))
      } else if (message.includes('UserNotConfirmedException')) {
        setError(t('userNotConfirmed', 'Your account has not been confirmed. Please contact your administrator.'))
      } else {
        setError(message)
      }
      setIsLoading(false)
    }
  }

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError(t('passwordTooShort', 'Password must be at least 8 characters.'))
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError(t('passwordsDoNotMatch', 'Passwords do not match.'))
      return
    }

    setIsLoading(true)

    try {
      const result = await completeNewPassword(newPassword)

      if (result.isSignedIn) {
        await useAuthStore.getState().initializeAuth()
        navigate({ to: '/home', replace: true })
      } else {
        setError(t('authFailed'))
        setIsLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('newPasswordError', 'Failed to set new password. Please try again.')
      setError(message)
      setIsLoading(false)
    }
  }

  const switchView = (newView: AuthView) => {
    setView(newView)
    setError(null)
    setShowPassword(false)
    setNewPassword('')
    setConfirmNewPassword('')
    setShowNewPassword(false)
  }

  const forgotPasswordUrl = getForgotPasswordUrl()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="ghost" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Brand */}
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

          {/* Card */}
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <AnimatePresence mode="wait">
              {view === 'signin' && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-semibold mb-1" style={{ color: '#1E293B' }}>
                    {t('signInHeading', 'Sign in')}
                  </h1>
                  <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                    {t('signInSubheading', 'to continue to EdForge')}
                  </p>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 p-3 mb-5 rounded-xl"
                      style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                      <span className="text-sm" style={{ color: '#DC2626' }}>{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
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
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                        {t('password', 'Password')}
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl outline-none transition-colors"
                          style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#1E293B',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
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
                    </div>

                    {/* Forgot password */}
                    {forgotPasswordUrl && (
                      <div className="text-right">
                        <a
                          href={forgotPasswordUrl}
                          className="text-sm font-medium transition-colors hover:underline"
                          style={{ color: '#F97316' }}
                        >
                          {t('forgotPassword')}
                        </a>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || !email.trim() || !password}
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
                          {t('signingIn')}
                        </>
                      ) : (
                        t('signInHeading', 'Sign in')
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
              {view === 'force-new-password' && (
                <motion.div
                  key="force-new-password"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-semibold mb-1" style={{ color: '#1E293B' }}>
                    {t('setNewPasswordHeading', 'Set a new password')}
                  </h1>
                  <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                    {t('setNewPasswordSubheading', 'Your administrator created your account with a temporary password. Please choose a new password to continue.')}
                  </p>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 p-3 mb-5 rounded-xl"
                      style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                      <span className="text-sm" style={{ color: '#DC2626' }}>{error}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSetNewPassword} className="space-y-4">
                    {/* New password */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                        {t('newPassword', 'New password')}
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
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
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors hover:bg-gray-100"
                          style={{ color: '#94A3B8' }}
                          tabIndex={-1}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label htmlFor="confirmNewPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                        {t('confirmPassword', 'Confirm password')}
                      </label>
                      <div className="relative">
                        <input
                          id="confirmNewPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl outline-none transition-colors"
                          style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#1E293B',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || !newPassword || !confirmNewPassword}
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
                          {t('settingPassword', 'Setting password...')}
                        </>
                      ) : (
                        t('setPassword', 'Set password')
                      )}
                    </button>
                  </form>

                  {/* Back to sign in */}
                  <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
                    <button
                      type="button"
                      onClick={() => switchView('signin')}
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: '#F97316' }}
                    >
                      {t('backToSignIn', 'Back to sign in')}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {t('secureAuth')}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/privacy" className="text-xs transition-colors hover:underline" style={{ color: '#94A3B8' }}>
                Privacy
              </Link>
              <Link to="/terms" className="text-xs transition-colors hover:underline" style={{ color: '#94A3B8' }}>
                Terms
              </Link>
              <Link to="/security" className="text-xs transition-colors hover:underline" style={{ color: '#94A3B8' }}>
                Security
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
