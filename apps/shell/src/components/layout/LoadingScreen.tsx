/**
 * Loading Screen
 *
 * Full-screen loading indicator for lazy-loaded modules.
 */

import { motion } from 'framer-motion'
import { useTranslation } from '@edforge/i18n'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useTranslation('errors')
  const displayMessage = message || t('loadingModule')

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated Logo */}
        <div className="relative w-16 h-16" aria-hidden="true">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))]"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute inset-2 rounded-xl bg-surface-secondary flex items-center justify-center"
            animate={{
              scale: [1, 0.95, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))] bg-clip-text text-transparent">
              E
            </span>
          </motion.div>
        </div>

        {/* Loading Text */}
        <p className="text-text-secondary text-sm">{displayMessage}</p>

        {/* Progress Dots */}
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[rgb(var(--action-primary-bg))]"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
