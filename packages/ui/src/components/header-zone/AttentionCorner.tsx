/**
 * AttentionCorner — the page-scoped attention system for the header zone.
 *
 * Compound component:
 *   <AttentionCorner signals acked onAck onUnack>          ← provider (no DOM)
 *     <PageHeader mode="pagebar" attention={<AttentionCornerPill/>} … />
 *     <AttentionCornerShade className="pt-3" />            ← full-width, in flow
 *   </AttentionCorner>
 *
 * Collapsed: a severity-segmented pill (●2 ●1 ●3 + "need attention"; mint
 * "✓ All clear" when empty; critical dot pulses). Expanded on desktop: a shade
 * slides down in flow, pushing content (measured-height animation — never an
 * auto-height jump). Express the gap above the shade as pt-* via `className`
 * (applied INSIDE the measured height) — never a margin on/around the shade or
 * a `space-y-*` slot: margins sit outside the animated box and pop at
 * mount/unmount instead of animating. On mobile (<768px) the same content
 * presents as a focus-trapped bottom sheet with a scrim.
 *
 * Signal rows are severity-ranked and carry: icon chip · SABER domain tag ·
 * title/sub · a deep-link fix (primary on critical) · 👍 acknowledge on
 * critical (spring pop + radiating ring; persisted upstream via onAck, undo
 * via the "Acknowledged" chip) · dismiss × on warn/info (session-scoped).
 * Acknowledged signals leave the pill count but stay dimmed in the shade;
 * dismissed signals leave both until remount. Signals derived from live data
 * auto-resolve by no longer being emitted. Reduced-motion collapses every
 * animation to its end state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, ThumbsUp, X } from 'lucide-react'
import { cn, focusRing } from '../../utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import {
  DEFAULT_ATTENTION_LABELS,
  type AttentionCornerLabels,
  type Signal,
  type SignalSeverity,
} from './Signal'

const SEVERITY_ORDER: SignalSeverity[] = ['critical', 'warn', 'info']

const SEVERITY_STYLES: Record<
  SignalSeverity,
  { dot: string; row: string; title: string; chip: string; tag: string }
> = {
  critical: {
    dot: 'bg-[rgb(var(--state-danger-fg))]',
    row: 'border-[rgb(var(--state-danger-fg)/0.2)] bg-[rgb(var(--state-danger-bg)/0.12)]',
    title: 'text-[rgb(var(--state-danger-fg))]',
    chip: 'bg-[rgb(var(--state-danger-bg)/0.3)] text-[rgb(var(--state-danger-fg))]',
    tag: 'border-[rgb(var(--state-danger-fg)/0.25)] bg-[rgb(var(--state-danger-bg)/0.3)] text-[rgb(var(--state-danger-fg))]',
  },
  warn: {
    dot: 'bg-[rgb(var(--state-warning-border))]',
    row: 'border-[rgb(var(--state-warning-fg)/0.2)] bg-[rgb(var(--state-warning-bg)/0.12)]',
    title: 'text-[rgb(var(--state-warning-fg))]',
    chip: 'bg-[rgb(var(--state-warning-bg)/0.3)] text-[rgb(var(--state-warning-fg))]',
    tag: 'border-[rgb(var(--state-warning-fg)/0.25)] bg-[rgb(var(--state-warning-bg)/0.3)] text-[rgb(var(--state-warning-fg))]',
  },
  info: {
    dot: 'bg-[rgb(var(--state-info-fg))]',
    row: 'border-[rgb(var(--state-info-fg)/0.2)] bg-[rgb(var(--state-info-bg)/0.12)]',
    title: 'text-[rgb(var(--state-info-fg))]',
    chip: 'bg-[rgb(var(--state-info-bg)/0.3)] text-[rgb(var(--state-info-fg))]',
    tag: 'border-[rgb(var(--state-info-fg)/0.25)] bg-[rgb(var(--state-info-bg)/0.3)] text-[rgb(var(--state-info-fg))]',
  },
}

interface AttentionContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  pillRef: React.RefObject<HTMLButtonElement | null>
  labels: AttentionCornerLabels
  /** Live (not dismissed) signals, severity-ranked. */
  visible: Signal[]
  /** Pill counts exclude acknowledged signals. */
  counts: Record<SignalSeverity, number>
  total: number
  ackedSet: ReadonlySet<string>
  onAck?: (id: string) => void
  onUnack?: (id: string) => void
  dismiss: (id: string) => void
}

const AttentionContext = createContext<AttentionContextValue | null>(null)

function useAttentionContext(component: string): AttentionContextValue {
  const ctx = useContext(AttentionContext)
  if (!ctx) throw new Error(`${component} must be rendered inside <AttentionCorner>`)
  return ctx
}

export interface AttentionCornerProps {
  signals: Signal[]
  /** Acknowledged signal ids (persisted per user by the app). */
  acked?: ReadonlySet<string> | readonly string[]
  onAck?: (id: string) => void
  onUnack?: (id: string) => void
  labels?: Partial<AttentionCornerLabels>
  children: ReactNode
}

export function AttentionCorner({
  signals,
  acked,
  onAck,
  onUnack,
  labels: labelOverrides,
  children,
}: AttentionCornerProps) {
  const [open, setOpen] = useState(false)
  // Session-scoped dismissals (warn/info ×). Resets on remount by design.
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set())
  const pillRef = useRef<HTMLButtonElement | null>(null)

  const labels = useMemo(
    () => ({ ...DEFAULT_ATTENTION_LABELS, ...labelOverrides }),
    [labelOverrides],
  )
  const ackedSet = useMemo(() => new Set(acked ?? []), [acked])

  const visible = useMemo(
    () =>
      [...signals]
        .filter((s) => !dismissed.has(s.id))
        .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)),
    [signals, dismissed],
  )

  const counts = useMemo(() => {
    const c: Record<SignalSeverity, number> = { critical: 0, warn: 0, info: 0 }
    for (const s of visible) if (!ackedSet.has(s.id)) c[s.severity]++
    return c
  }, [visible, ackedSet])
  const total = counts.critical + counts.warn + counts.info

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }, [])

  // Esc closes the shade (when no higher-priority surface consumed it) and
  // returns focus to the pill.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        pillRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const value = useMemo<AttentionContextValue>(
    () => ({ open, setOpen, pillRef, labels, visible, counts, total, ackedSet, onAck, onUnack, dismiss }),
    [open, labels, visible, counts, total, ackedSet, onAck, onUnack, dismiss],
  )

  return <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>
}

/** The collapsed control — mounts into the page header's top-left slot. */
export function AttentionCornerPill({
  className,
  ...rest
}: { className?: string } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  const { open, setOpen, pillRef, labels, counts, total } = useAttentionContext('AttentionCornerPill')
  const reduce = useReducedMotion()

  const base = cn(
    'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors',
    focusRing,
    className,
  )

  if (total === 0) {
    return (
      <button
        ref={pillRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          base,
          'border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg)/0.4)] text-[rgb(var(--state-success-fg))]',
        )}
        {...rest}
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        {labels.allClear}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform motion-reduce:transition-none', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
    )
  }

  return (
    <button
      ref={pillRef}
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={cn(
        base,
        'border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-primary)/0.8)]',
      )}
      {...rest}
    >
      {SEVERITY_ORDER.filter((sev) => counts[sev] > 0).map((sev) => (
        <span key={sev} className="inline-flex items-center gap-1.5 tabular-nums">
          <motion.span
            className={cn('h-1.5 w-1.5 rounded-full', SEVERITY_STYLES[sev].dot)}
            animate={
              sev === 'critical' && !reduce
                ? { scale: [1, 1.45, 1], opacity: [1, 0.75, 1] }
                : undefined
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          {counts[sev]}
        </span>
      ))}
      <span className="font-medium text-[rgb(var(--text-tertiary))]">{labels.needAttention}</span>
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 text-[rgb(var(--text-tertiary))] transition-transform motion-reduce:transition-none',
          open && 'rotate-180',
        )}
        aria-hidden="true"
      />
    </button>
  )
}

/**
 * The expanding region — render full-width directly below the page header.
 *
 * `className` lands on the inner content layer, inside the animated height.
 * Pass the header gap as padding (`pt-3` / `pt-5`) — never `mt-*`, and never
 * let the shade be a direct `space-y-*` child: margins live outside the
 * measured box and pop in/out at mount/unmount instead of animating.
 */
export function AttentionCornerShade({ className }: { className?: string }) {
  const ctx = useAttentionContext('AttentionCornerShade')
  const { open, setOpen, pillRef, labels, visible } = ctx
  const reduce = useReducedMotion()
  // Unification seam: this predates useBreakpoint (640/1024). Re-basing would
  // flip tablet 640-767 from bottom-sheet to in-flow shade — revisit with the
  // Academics mobile pass, not as a drive-by.
  const isMobile = useMediaQuery('(max-width: 767px)')
  const sheetRef = useRef<HTMLDivElement | null>(null)
  useFocusTrap(sheetRef, open && isMobile)

  const close = () => {
    setOpen(false)
    pillRef.current?.focus()
  }

  const body = (
    <div className="rounded-xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-tertiary)/0.5)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <span className="text-2xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
          {labels.region}
        </span>
        <button
          type="button"
          onClick={close}
          className={cn(
            'rounded-md px-2 py-1 text-2xs font-medium text-[rgb(var(--text-tertiary))] transition-colors hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
            focusRing,
          )}
        >
          {labels.minimize}
        </button>
      </div>
      {visible.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg)/0.3)] px-3 py-2.5 text-sm text-[rgb(var(--state-success-fg))]">
          <Check className="h-4 w-4" aria-hidden="true" />
          {labels.emptyTitle}
        </div>
      ) : (
        <ul className="flex list-none flex-col gap-1.5 p-0">
          {visible.map((s) => (
            <SignalRow key={s.id} signal={s} />
          ))}
        </ul>
      )}
    </div>
  )

  if (isMobile) {
    // Bottom sheet + scrim (focus-trapped; Esc handled by the root).
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[rgb(var(--text-primary)/0.4)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={close}
              aria-hidden="true"
            />
            <motion.div
              ref={sheetRef}
              role="region"
              aria-label={labels.region}
              className="fixed inset-x-0 bottom-0 z-50 overflow-y-auto rounded-t-2xl bg-[rgb(var(--background-secondary))] p-3 pb-6 shadow-xl"
              style={{ maxHeight: '72vh' }}
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              exit={{ y: '105%' }}
              transition={{ duration: reduce ? 0 : 0.32, ease: [0.32, 0.72, 0, 1] }}
            >
              <span
                className="mx-auto mb-2 block h-1 w-10 rounded-full bg-[rgb(var(--border-primary)/0.6)]"
                aria-hidden="true"
              />
              {body}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Desktop: an in-flow shade that pushes content (measured-height animation).
  // Two layers, deliberately split:
  //  - OUTER animates height only (symmetric standard ease both directions) and
  //    clips via overflow-hidden. It must never carry padding or margins — with
  //    border-box sizing, padding puts a floor under `height: 0`, and margins
  //    sit outside the animated box, so both pop at mount/unmount.
  //  - INNER carries the caller's gap as padding (className, e.g. `pt-3`)
  //    INSIDE the measured height, and cross-fades on its own timing: in after
  //    a short delay, out fast — content is gone before the box finishes
  //    closing (no ghost) and the gap grows/shrinks with the height.
  // Eases mirror the theme tokens (base.css): standard (0.4,0,0.2,1),
  // enter (0.16,1,0.3,1), exit (0.4,0,1,1) — framer needs literal arrays.
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          role="region"
          aria-label={labels.region}
          className="overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className={className}
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: reduce
                ? { duration: 0 }
                : { duration: 0.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
            }}
            exit={{
              opacity: 0,
              y: -6,
              transition: reduce ? { duration: 0 } : { duration: 0.15, ease: [0.4, 0, 1, 1] },
            }}
          >
            {body}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SignalRow({ signal }: { signal: Signal }) {
  const { labels, ackedSet, onAck, onUnack, dismiss } = useAttentionContext('AttentionCornerShade')
  const reduce = useReducedMotion()
  const [acking, setAcking] = useState(false)
  const styles = SEVERITY_STYLES[signal.severity]
  const isAcked = ackedSet.has(signal.id)
  const ackable = signal.ackable ?? signal.severity === 'critical'

  const handleAck = () => {
    if (acking || !onAck) return
    if (reduce) {
      onAck(signal.id)
      return
    }
    setAcking(true)
    window.setTimeout(() => {
      setAcking(false)
      onAck(signal.id)
    }, 480)
  }

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5',
        styles.row,
        isAcked && 'opacity-60',
      )}
    >
      {signal.icon ? (
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', styles.chip)}>
          {signal.icon}
        </span>
      ) : null}
      <span
        className={cn(
          'inline-flex h-4 shrink-0 items-center rounded border px-1.5 text-3xs font-bold uppercase tracking-wider',
          isAcked ? 'border-[rgb(var(--border-primary)/0.4)] text-[rgb(var(--text-tertiary))]' : styles.tag,
        )}
      >
        {signal.domain}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-semibold', isAcked ? 'text-[rgb(var(--text-secondary))]' : styles.title)}>
          {signal.title}
        </div>
        {signal.description ? (
          <div className="text-2xs text-[rgb(var(--text-tertiary))]">{signal.description}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isAcked ? (
          <button
            type="button"
            onClick={() => onUnack?.(signal.id)}
            title={labels.acknowledgedHint}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-full border border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg)/0.4)] px-2.5 text-2xs font-semibold text-[rgb(var(--state-success-fg))]',
              focusRing,
            )}
          >
            <ThumbsUp className="h-3 w-3" aria-hidden="true" />
            {labels.acknowledged}
          </button>
        ) : (
          <>
            {signal.fix ? (
              <button
                type="button"
                onClick={signal.fix.onAction}
                className={cn(
                  'inline-flex h-7 items-center rounded-lg px-2.5 text-2xs font-semibold transition-colors',
                  focusRing,
                  signal.severity === 'critical'
                    ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))]'
                    : 'border border-[rgb(var(--border-primary)/0.4)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]',
                )}
              >
                {signal.fix.label}
              </button>
            ) : null}
            {ackable && onAck ? (
              <button
                type="button"
                onClick={handleAck}
                aria-label={`${labels.acknowledge} — ${signal.title}`}
                className={cn(
                  'relative inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-2xs font-semibold transition-colors',
                  focusRing,
                  acking
                    ? 'border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg)/0.4)] text-[rgb(var(--state-success-fg))]'
                    : 'border-[rgb(var(--border-primary)/0.4)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:border-[rgb(var(--state-success-border))] hover:text-[rgb(var(--state-success-fg))]',
                )}
              >
                <motion.span
                  className="inline-flex"
                  animate={acking && !reduce ? { scale: [1, 1.4, 0.9, 1], rotate: [0, -12, 4, 0] } : undefined}
                  transition={{ duration: 0.48, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <ThumbsUp className="h-3 w-3" aria-hidden="true" />
                </motion.span>
                {acking && !reduce ? (
                  <motion.span
                    className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[rgb(var(--state-success-fg))]"
                    initial={{ scale: 0.5, opacity: 0.6 }}
                    animate={{ scale: 2.3, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    aria-hidden="true"
                  />
                ) : null}
                {labels.acknowledge}
              </button>
            ) : null}
            {signal.severity !== 'critical' ? (
              <button
                type="button"
                onClick={() => dismiss(signal.id)}
                aria-label={`${labels.dismiss} — ${signal.title}`}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg border border-[rgb(var(--border-primary)/0.4)] text-[rgb(var(--text-tertiary))] transition-colors hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
                  focusRing,
                )}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </>
        )}
      </div>
    </li>
  )
}
