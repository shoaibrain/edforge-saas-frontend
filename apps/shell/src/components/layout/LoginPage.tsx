/**
 * Login Page
 *
 * Production authentication flow via AWS Cognito Hosted UI.
 * Fully localized via @edforge/i18n.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { LogIn, Loader2, AlertCircle } from 'lucide-react'
import { Button, LanguageSwitcher } from '@edforge/ui'
import { login as cognitoLogin, getForgotPasswordUrl } from '@edforge/auth'
import { useTranslation } from '@edforge/i18n'
import { useAuthStore } from '../../stores/auth.store'

export function LoginPage() {
  const isStoreAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const { t } = useTranslation('auth')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already authenticated in store, redirect to home
  useEffect(() => {
    if (isStoreAuthenticated) {
      navigate({ to: '/home', replace: true })
    }
  }, [isStoreAuthenticated, navigate])

  const handleCognitoLogin = async () => {
    setIsLoading(true)
    setError(null)

    // Clear the session invalidation flag so auth can proceed after login
    sessionStorage.removeItem('edforge-session-invalidated')

    try {
      // First, ensure we're signed out from any existing Cognito session
      const { signOut } = await import('aws-amplify/auth')
      try {
        await signOut()
      } catch {
        // Ignore signout errors — user might not be signed in
      }

      await cognitoLogin()
      // User will be redirected to Cognito Hosted UI
    } catch (err) {
      console.error('Login failed:', err)
      setError(err instanceof Error ? err.message : t('loginError'))
      setIsLoading(false)
    }
  }

  const forgotPasswordUrl = getForgotPasswordUrl()

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-500 via-ink-400 to-teal-800 flex items-center justify-center p-6">
      {/* Language switcher — top right corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="ghost" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/25 border border-teal-400/40 mb-5"
          >
            <span className="text-2xl font-bold text-teal-200">E</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-2"
          >
            {t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-teal-100 text-sm"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/30 p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-1">{t('welcomeBack')}</h2>
          <p className="text-slate-300 text-sm mb-8">
            {t('signInDescription')}
          </p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 mb-6 rounded-xl bg-red-500/15 border border-red-500/25"
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-red-300">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="block text-xs text-red-400/80 hover:text-red-300 mt-1 underline underline-offset-2"
                >
                  {t('tryAgain')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Sign In Button */}
          <Button
            onClick={handleCognitoLogin}
            disabled={isLoading}
            className="w-full bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-white font-semibold"
            size="lg"
            aria-label={t('signIn')}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('signingIn')}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                {t('signIn')}
              </>
            )}
          </Button>

          {/* Forgot Password */}
          {forgotPasswordUrl && (
            <div className="text-center mt-5">
              <a
                href={forgotPasswordUrl}
                className="text-sm text-teal-200 hover:text-white transition-colors underline underline-offset-2"
              >
                {t('forgotPassword')}
              </a>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-400 text-xs mt-8"
        >
          {t('secureAuth')}
        </motion.p>
      </motion.div>
    </div>
  )
}
