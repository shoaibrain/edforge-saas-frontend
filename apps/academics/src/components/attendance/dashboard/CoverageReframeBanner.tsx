/**
 * CoverageReframeBanner — the info-toned callout that leads the Attendance
 * dashboard, explaining that the deflated "school average" is a recording-
 * COVERAGE artifact, not real absence. Two actions: jump to recording a section,
 * and a 👍 acknowledge pill that pops (spring) then collapses the banner and
 * persists the dismissal (per user, via useAcknowledged). Reduced-motion → the
 * pop + collapse resolve instantly. Reusable acknowledgeable-notice pattern.
 */

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Gauge, ThumbsUp, ArrowRight } from 'lucide-react'
import { useAcknowledged } from '../../../hooks/useAcknowledged'
import { useAcademicsI18n } from '../../../lib/i18n'

const ACK_KEY = 'attendance.reframe'

interface CoverageReframeBannerProps {
  artifactPct: number
  recordedRate: number
  onRecordFirst: () => void
  /** Whether a not-yet-recorded section exists (enables "Record a section"). */
  canRecord: boolean
}

export function CoverageReframeBanner({
  artifactPct,
  recordedRate,
  onRecordFirst,
  canRecord,
}: CoverageReframeBannerProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const reduce = useReducedMotion()
  const [acked, acknowledge] = useAcknowledged(ACK_KEY)
  // Snapshot at mount: if already acknowledged, never render (no entrance flash).
  const [gone, setGone] = useState(acked)
  const [collapsing, setCollapsing] = useState(false)
  const [popped, setPopped] = useState(false)

  if (gone) return null

  const handleAck = () => {
    if (collapsing) return
    setPopped(true)
    acknowledge()
    if (reduce) setGone(true)
    else setCollapsing(true)
  }

  return (
    <AnimatePresence initial={false} onExitComplete={() => setGone(true)}>
      {!collapsing && (
        <motion.div
          key="reframe"
          initial={false}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ duration: reduce ? 0 : 0.34, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-[rgb(var(--state-info-fg)/0.2)] bg-[rgb(var(--state-info-bg)/0.12)] px-4 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--state-info-bg)/0.3)] text-[rgb(var(--state-info-fg))]">
              <Gauge className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
              <strong className="font-semibold text-[rgb(var(--text-primary))]">
                {t('attendance.dashboard.reframe.headline', { pct: formatNumber(Number(artifactPct.toFixed(1))) })}
              </strong>{' '}
              {t('attendance.dashboard.reframe.body', { rate: formatNumber(Math.round(recordedRate)) })}
            </p>
            <div className="flex shrink-0 items-center gap-2 self-center">
              {canRecord && (
                <button
                  type="button"
                  onClick={onRecordFirst}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] px-3 text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
                >
                  {t('attendance.dashboard.reframe.record')}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={handleAck}
                aria-label={t('attendance.dashboard.reframe.ackAria')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  popped
                    ? 'border-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.4)] text-[rgb(var(--state-success-fg))]'
                    : 'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:border-[rgb(var(--state-success-border))] hover:bg-[rgb(var(--state-success-bg)/0.3)] hover:text-[rgb(var(--state-success-fg))]'
                }`}
              >
                <motion.span
                  animate={popped && !reduce ? { scale: [1, 1.4, 0.9, 1], rotate: [0, -12, 4, 0] } : { scale: 1, rotate: 0 }}
                  transition={{ duration: reduce ? 0 : 0.52, ease: [0.34, 1.56, 0.64, 1] }}
                  className="inline-flex"
                >
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                </motion.span>
                {t('attendance.dashboard.reframe.ack')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
