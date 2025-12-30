/**
 * Login Page
 *
 * Supports two authentication modes:
 * 1. Production: Redirects to AWS Cognito Hosted UI
 * 2. Dev Mode: Mock user selection for testing
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { 
  User, 
  Shield, 
  GraduationCap, 
  DollarSign, 
  Book, 
  UserCircle,
  LogIn,
  Code2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button, Card, CardContent } from '@edforge/ui'
import { login as cognitoLogin } from '@edforge/auth'
import { useAuthStore } from '../../stores/auth.store'

// Demo users for dev mode
const DEMO_USERS = [
  {
    id: 'tenant-admin',
    label: 'Tenant Admin',
    description: 'Full access to all schools',
    icon: Shield,
  },
  {
    id: 'principal',
    label: 'Principal',
    description: 'School administrator',
    icon: GraduationCap,
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Classroom educator',
    icon: Book,
  },
  {
    id: 'accountant',
    label: 'Accountant',
    description: 'Finance & billing',
    icon: DollarSign,
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Student portal access',
    icon: User,
  },
  {
    id: 'parent',
    label: 'Parent',
    description: 'Parent portal access',
    icon: UserCircle,
  },
]

export function LoginPage() {
  const { loginAsMock, isAuthenticated: isStoreAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  const [isDevMode, setIsDevMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>('tenant-admin')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already authenticated in store, redirect to home
  // This is the single source of truth - no need to check Cognito directly here
  // The auth callback route and shell context handle Cognito auth initialization
  useEffect(() => {
    if (isStoreAuthenticated) {
      navigate({ to: '/home', replace: true })
    }
  }, [isStoreAuthenticated, navigate])

  /**
   * Handle Cognito login - redirects to Hosted UI
   */
  const handleCognitoLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await cognitoLogin()
      // User will be redirected to Cognito Hosted UI
      // After successful auth, they'll be redirected back to the app
    } catch (err) {
      console.error('Login failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initiate login')
      setIsLoading(false)
    }
  }

  /**
   * Handle dev mode login with mock user
   */
  const handleDevModeLogin = () => {
    if (selectedUser) {
      loginAsMock(selectedUser)
      navigate({ to: '/home' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-ink-500 to-cyan-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-2"
          >
            EdForge
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-teal-200"
          >
            Next-Generation Education Management
          </motion.p>
        </div>

        {/* Login Card */}
        <Card glass>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {!isDevMode ? (
                /* Production Login Mode */
                <motion.div
                  key="production"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-xl font-semibold text-text-primary mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-text-secondary text-sm mb-6">
                    Sign in to access your education management system
                  </p>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rust-500/10 border border-rust-500/20 text-rust-500"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  {/* Cognito Login Button */}
                  <Button
                    onClick={handleCognitoLogin}
                    disabled={isLoading}
                    className="w-full mb-4"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In with EdForge
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-secondary" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-2 bg-surface-secondary text-text-tertiary">
                        Or
                      </span>
                    </div>
                  </div>

                  {/* Dev Mode Toggle */}
                  <button
                    onClick={() => setIsDevMode(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    <Code2 className="w-4 h-4" />
                    Developer Mode (Demo Users)
                  </button>
                </motion.div>
              ) : (
                /* Dev Mode - Mock User Selection */
                <motion.div
                  key="dev-mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">
                      Developer Mode
                    </h2>
                    <button
                      onClick={() => setIsDevMode(false)}
                      className="text-sm text-teal-500 hover:text-teal-400 transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                  <p className="text-text-secondary text-sm mb-6">
                    Select a demo user to explore different permission levels
                  </p>

                  {/* User Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {DEMO_USERS.map((user, index) => (
                      <motion.button
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + index * 0.03 }}
                        onClick={() => setSelectedUser(user.id)}
                        className={`
                          p-4 rounded-xl text-left transition-all duration-200
                          ${selectedUser === user.id
                            ? 'bg-teal-500/20 border-2 border-teal-500 dark:border-cyan-400'
                            : 'bg-surface-tertiary border-2 border-transparent hover:border-border-primary'
                          }
                        `}
                      >
                        <user.icon
                          className={`
                            w-6 h-6 mb-2
                            ${selectedUser === user.id
                              ? 'text-teal-600 dark:text-cyan-400'
                              : 'text-text-tertiary'
                            }
                          `}
                        />
                        <p className="font-medium text-text-primary">{user.label}</p>
                        <p className="text-xs text-text-tertiary">{user.description}</p>
                      </motion.button>
                    ))}
                  </div>

                  {/* Login Button */}
                  <Button
                    onClick={handleDevModeLogin}
                    disabled={!selectedUser}
                    className="w-full"
                    size="lg"
                  >
                    Continue as {DEMO_USERS.find((u) => u.id === selectedUser)?.label || 'User'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-teal-300/60 text-sm mt-6"
        >
          {isDevMode ? 'Demo mode • All data is simulated' : 'Secure authentication powered by AWS Cognito'}
        </motion.p>
      </motion.div>
    </div>
  )
}
