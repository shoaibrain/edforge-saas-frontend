/**
 * Login Page
 *
 * Production authentication with embedded sign-in form.
 * Uses Cognito's direct signIn API (no hosted UI redirect).
 * Sign-up and Google auth are UI placeholders for future implementation.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { LanguageSwitcher } from '@edforge/ui'
import { signInDirect, getForgotPasswordUrl } from '@edforge/auth'
import { useTranslation } from '@edforge/i18n'
import { useAuthStore } from '../../stores/auth.store'
import { toast } from 'sonner'

type AuthView = 'signin' | 'signup'

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

  // Sign-up fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

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
        setError(t('newPasswordRequired', 'You need to set a new password. Please use the forgot password link.'))
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

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    toast.info(t('signUpComingSoon', 'Self-registration is coming soon. Contact your administrator for access.'))
  }

  const handleGoogleSignIn = () => {
    toast.info(t('googleComingSoon', 'Google sign-in is coming soon.'))
  }

  const switchView = (newView: AuthView) => {
    setView(newView)
    setError(null)
    setShowPassword(false)
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
              {view === 'signin' ? (
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

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
                    <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>or</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
                  </div>

                  {/* Google sign-in */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      color: '#374151',
                    }}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('continueWithGoogle', 'Continue with Google')}
                  </button>

                  {/* Switch to sign-up */}
                  <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
                    {t('noAccount', "Don't have an account?")}{' '}
                    <button
                      type="button"
                      onClick={() => switchView('signup')}
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: '#F97316' }}
                    >
                      {t('signUp', 'Sign up')}
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-semibold mb-1" style={{ color: '#1E293B' }}>
                    {t('createAccount', 'Create account')}
                  </h1>
                  <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                    {t('signUpSubheading', 'to get started with EdForge')}
                  </p>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                          {t('firstName', 'First name')}
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          autoComplete="given-name"
                          required
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-colors"
                          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                          {t('lastName', 'Last name')}
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                          required
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-colors"
                          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="signupEmail" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                        {t('email', 'Email')}
                      </label>
                      <input
                        id="signupEmail"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@school.edu"
                        autoComplete="email"
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-colors"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="signupPassword" className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                        {t('password', 'Password')}
                      </label>
                      <div className="relative">
                        <input
                          id="signupPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl outline-none transition-colors"
                          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B' }}
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

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: '#F97316',
                        color: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(249,115,22,0.3)',
                      }}
                    >
                      {t('createAccount', 'Create account')}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
                    <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>or</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
                  </div>

                  {/* Google sign-up */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      color: '#374151',
                    }}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('continueWithGoogle', 'Continue with Google')}
                  </button>

                  {/* Switch to sign-in */}
                  <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
                    {t('hasAccount', 'Already have an account?')}{' '}
                    <button
                      type="button"
                      onClick={() => switchView('signin')}
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: '#F97316' }}
                    >
                      {t('signInHeading', 'Sign in')}
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
