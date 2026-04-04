/**
 * GettingStartedGuide — Linear-style onboarding checklist for new tenants.
 *
 * Shown at the top of the AdminCommandCenter when a tenant has just
 * completed onboarding. Each item links to the relevant setup page
 * and auto-completes when the action is detected.
 */

import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  Sparkles,
  Lock,
} from 'lucide-react'
import type { GettingStartedItem } from '../../hooks/useGettingStarted'

// ============================================================================
// TYPES
// ============================================================================

interface GettingStartedGuideProps {
  items: GettingStartedItem[]
  completedCount: number
  totalCount: number
  onDismiss: () => void
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.25 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GettingStartedGuide({
  items,
  completedCount,
  totalCount,
  onDismiss,
}: GettingStartedGuideProps) {
  const progress = totalCount > 0 ? completedCount / totalCount : 0
  const firstIncompleteIdx = items.findIndex((i) => !i.completed && !i.blocked)

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="rounded-xl border overflow-hidden"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 28,
                height: 28,
                background: 'var(--v2-accent-enrollment)',
              }}
            >
              <Sparkles
                className="w-[15px] h-[15px]"
                style={{ color: 'var(--v2-brand-primary)' }}
              />
            </div>
            <div>
              <h3
                className="text-[13px] font-semibold leading-tight"
                style={{ color: 'var(--v2-text-primary)' }}
              >
                Get started with EdForge
              </h3>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: 'var(--v2-text-faint)' }}
              >
                {completedCount} of {totalCount} complete
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Dismiss getting started guide"
          >
            <X className="w-4 h-4" style={{ color: 'var(--v2-text-faint)' }} />
          </button>
        </div>

        {/* ── Progress Bar ────────────────────────────────────────────── */}
        <div className="px-5 pb-3">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--v2-bg-inset, rgba(0,0,0,0.06))' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #0a9396, #14b8a6)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              layout
            />
          </div>
        </div>

        {/* ── Checklist ───────────────────────────────────────────────── */}
        <div className="px-3 pb-3">
          {items.map((item, idx) => {
            const isFirstIncomplete = idx === firstIncompleteIdx
            const Icon = item.icon

            return (
              <motion.div key={item.id} variants={itemVariants}>
                <Link
                  to={item.blocked ? '/home' : (item.href as any)}
                  className="group flex items-center gap-3 px-2.5 py-2.5 rounded-lg no-underline transition-colors"
                  style={{
                    background: isFirstIncomplete
                      ? 'var(--v2-accent-enrollment)'
                      : 'transparent',
                    cursor: item.blocked ? 'default' : 'pointer',
                    opacity: item.blocked ? 0.5 : item.completed ? 0.6 : 1,
                  }}
                  onClick={(e) => {
                    if (item.blocked) e.preventDefault()
                  }}
                  onMouseEnter={(e) => {
                    if (!item.blocked && !isFirstIncomplete) {
                      e.currentTarget.style.background = 'var(--v2-bg-hover, rgba(0,0,0,0.03))'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isFirstIncomplete) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Status indicator */}
                  <div className="shrink-0">
                    {item.completed ? (
                      <CheckCircle2
                        className="w-[18px] h-[18px]"
                        style={{ color: '#1D9E75' }}
                      />
                    ) : item.blocked ? (
                      <Lock
                        className="w-[15px] h-[15px] ml-[1.5px]"
                        style={{ color: 'var(--v2-text-faint)' }}
                      />
                    ) : (
                      <Circle
                        className="w-[18px] h-[18px]"
                        style={{
                          color: isFirstIncomplete
                            ? 'var(--v2-brand-primary)'
                            : 'var(--v2-text-faint)',
                        }}
                      />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className="shrink-0 flex items-center justify-center rounded-md"
                    style={{
                      width: 28,
                      height: 28,
                      background: item.completed
                        ? 'rgba(29, 158, 117, 0.08)'
                        : 'var(--v2-bg-inset, rgba(0,0,0,0.04))',
                    }}
                  >
                    <Icon
                      className="w-[14px] h-[14px]"
                      style={{
                        color: item.completed
                          ? '#1D9E75'
                          : 'var(--v2-text-secondary)',
                      }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium leading-tight"
                        style={{
                          color: item.completed
                            ? 'var(--v2-text-faint)'
                            : 'var(--v2-text-primary)',
                          textDecoration: item.completed ? 'line-through' : 'none',
                        }}
                      >
                        {item.title}
                      </span>
                      {isFirstIncomplete && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'var(--v2-brand-primary)',
                            color: '#fff',
                          }}
                        >
                          Start here
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[11px] leading-tight mt-0.5 block"
                      style={{ color: 'var(--v2-text-faint)' }}
                    >
                      {item.blocked ? item.blockedHint : item.description}
                    </span>
                  </div>

                  {/* Arrow */}
                  {!item.completed && !item.blocked && (
                    <ChevronRight
                      className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--v2-text-faint)' }}
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
