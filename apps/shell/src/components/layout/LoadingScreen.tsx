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
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated Logo */}
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500"
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
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              E
            </span>
          </motion.div>
        </div>

        {/* Loading Text */}
        <p className="text-text-secondary text-sm">{displayMessage}</p>

        {/* Progress Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-teal-500"
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
