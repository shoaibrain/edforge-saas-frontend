/**
 * SchoolTransitionOverlay
 *
 * A lightweight overlay shown over the main content area while school
 * context is switching and queries are refetching. Fades in/out with
 * Framer Motion for consistency with the rest of the UI.
 *
 * Includes a timeout-based error state: if the transition takes longer
 * than STALL_TIMEOUT_MS, a "Taking longer than expected" message with
 * a manual retry button is shown.
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useIsSchoolTransitioning, useAppStore } from '../../stores/app.store'

const STALL_TIMEOUT_MS = 8_000

export function SchoolTransitionOverlay() {
  const isTransitioning = useIsSchoolTransitioning()
  const [isStalled, setIsStalled] = useState(false)
  const queryClient = useQueryClient()

  // Track how long the transition has been active
  useEffect(() => {
    if (!isTransitioning) {
      setIsStalled(false)
      return
    }

    const timer = setTimeout(() => setIsStalled(true), STALL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isTransitioning])

  const handleRetry = () => {
    setIsStalled(false)
    // Re-invalidate all queries to force fresh fetches
    queryClient.invalidateQueries()
  }

  const handleDismiss = () => {
    setIsStalled(false)
    useAppStore.getState().setSchoolTransitioning(false)
  }

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="school-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--surface-primary))]/60 backdrop-blur-[2px] ${isStalled ? '' : 'pointer-events-none'}`}
          aria-live="polite"
          aria-label="Switching school context"
        >
          <div className="flex flex-col items-center gap-3">
            {isStalled ? (
              <>
                <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                  Taking longer than expected
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-xs text-center">
                  This may be a network issue. You can retry or dismiss and continue.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[rgb(var(--border-secondary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-teal-500 dark:bg-cyan-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
                  Switching school...
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
