/**
 * Step 0: Welcome — Greeting + Get Started button
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useShell } from '../../../lib/shell-context'
import type { OnboardingStepProps } from '../onboarding.types'

const FEATURE_PILLS = [
  'School Setup',
  'Academic Calendar',
  'Team Invites',
  'Regional Settings',
]

export function WelcomeStep({ onNext }: OnboardingStepProps) {
  const { user } = useShell()
  const firstName = user?.displayName || user?.name?.split(' ')[0] || 'there'

  // Allow Enter key to proceed
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNext])

  return (
    <div className="flex flex-col items-center text-center py-12 relative">
      {/* Subtle radial gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(10, 147, 150, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Logo with mount animation */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))] flex items-center justify-center mb-8 shadow-lg shadow-teal-500/20 relative z-10"
      >
        <span className="text-[rgb(var(--action-primary-fg))] font-bold text-2xl">E</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-3 relative z-10"
      >
        Welcome to EdForge, {firstName}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-base text-[rgb(var(--text-secondary))] mb-2 max-w-sm relative z-10"
      >
        Let&apos;s get your workspace ready. We&apos;ll walk you through a few quick steps to set up your organization.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="text-xs text-[rgb(var(--text-tertiary))] mb-5 relative z-10"
      >
        6 steps &middot; about 5 minutes
      </motion.p>

      {/* Feature preview pills */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex flex-wrap justify-center gap-2 mb-10 relative z-10"
      >
        {FEATURE_PILLS.map((pill) => (
          <span
            key={pill}
            className="text-xs px-3 py-1 rounded-full border font-medium"
            style={{
              color: 'rgb(var(--text-secondary))',
              borderColor: 'rgb(var(--border-primary))',
              background: 'rgb(var(--background-tertiary))',
            }}
          >
            {pill}
          </span>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="px-8 py-3 rounded-full bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))]  dark: text-[rgb(var(--action-primary-fg))] font-semibold text-base transition-colors hover:shadow-lg hover:shadow-teal-500/25 relative z-10"
      >
        Get Started
      </motion.button>
    </div>
  )
}
