/**
 * SchoolTransitionOverlay
 *
 * A lightweight, non-blocking overlay shown over the main content area
 * while school context is switching and the new school's queries are
 * refetching. Fades in/out with Framer Motion.
 *
 * The overlay is advisory: it never intercepts pointer events, per-widget
 * skeletons are the real loading affordance, and a hard cap forces it off
 * even if the settle signal misses (e.g. retry backoff tails). Failures
 * surface as a toast from the query cache, not from a timer here.
 */

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useIsSchoolTransitioning, useAppStore } from '../../stores/app.store'

const MAX_TRANSITION_MS = 5_000

export function SchoolTransitionOverlay() {
  const isTransitioning = useIsSchoolTransitioning()

  useEffect(() => {
    if (!isTransitioning) return
    const timer = setTimeout(() => {
      useAppStore.getState().setSchoolTransitioning(false)
    }, MAX_TRANSITION_MS)
    return () => clearTimeout(timer)
  }, [isTransitioning])

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="school-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--background-primary))]/60 backdrop-blur-[2px] pointer-events-none"
          role="status"
          aria-live="polite"
          aria-label="Switching school context"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[rgb(var(--action-primary-bg))]"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
