/**
 * Login Page
 *
 * Mock login page for development. In production, this should redirect to OIDC.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { User, Shield, GraduationCap, DollarSign, Book, UserCircle } from 'lucide-react'
import { Button, Card, CardContent } from '@edforge/ui'
import { useAuthStore } from '../../stores/auth.store'

const DEMO_USERS = [
  {
    id: 'tenant-admin',
    label: 'Tenant Admin',
    description: 'Full access to all schools',
    icon: Shield,
    color: 'teal',
  },
  {
    id: 'principal',
    label: 'Principal',
    description: 'School administrator',
    icon: GraduationCap,
    color: 'cyan',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Classroom educator',
    icon: Book,
    color: 'aqua',
  },
  {
    id: 'accountant',
    label: 'Accountant',
    description: 'Finance & billing',
    icon: DollarSign,
    color: 'golden',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Student portal access',
    icon: User,
    color: 'vanilla',
  },
  {
    id: 'parent',
    label: 'Parent',
    description: 'Parent portal access',
    icon: UserCircle,
    color: 'caramel',
  },
]

export function LoginPage() {
  const { loginAs } = useAuthStore()
  const navigate = useNavigate()
  const [selectedUser, setSelectedUser] = useState<string | null>('tenant-admin')

  const handleLogin = () => {
    if (selectedUser) {
      loginAs(selectedUser as 'tenant-admin' | 'principal' | 'teacher' | 'accountant' | 'student' | 'parent')
      // Navigate to home after successful login
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
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Select a Demo User
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Choose a role to explore EdForge with different permissions
            </p>

            {/* User Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {DEMO_USERS.map((user, index) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setSelectedUser(user.id)}
                  className={`
                    p-4 rounded-xl text-left transition-all duration-200
                    ${
                      selectedUser === user.id
                        ? 'bg-teal-500/20 border-2 border-teal-500 dark:border-cyan-400'
                        : 'bg-surface-tertiary border-2 border-transparent hover:border-border-primary'
                    }
                  `}
                >
                  <user.icon
                    className={`
                      w-6 h-6 mb-2
                      ${
                        selectedUser === user.id
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
              onClick={handleLogin}
              disabled={!selectedUser}
              className="w-full"
              size="lg"
            >
              Continue as {DEMO_USERS.find((u) => u.id === selectedUser)?.label || 'User'}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-teal-300/60 text-sm mt-6"
        >
          Demo mode • All data is simulated
        </motion.p>
      </motion.div>
    </div>
  )
}

