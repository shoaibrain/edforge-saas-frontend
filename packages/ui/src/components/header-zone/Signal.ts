import type { ReactNode } from 'react'

/**
 * Header Zone — Signal contract (Attention Corner).
 *
 * A Signal is a page-scoped, prompted decision: something in the data that
 * needs a human to act, tagged with the SABER-aligned domain it serves.
 * Signals are DERIVED from live query data by the page's hook (role-filtered
 * there, not here) — when the data heals, the signal simply stops being
 * emitted, which is what auto-resolves it in the UI.
 */
export type SignalSeverity = 'critical' | 'warn' | 'info'

export interface Signal {
  /** Stable id per source condition (e.g. 'academics.at-risk-critical'). */
  id: string
  severity: SignalSeverity
  /** SABER domain tag, already localized (Attendance · Assessment · Finance · Enrollment · Capacity · Data quality). */
  domain: string
  /** One line, specific and quantified. */
  title: string
  /** One line of context. */
  description?: string
  icon?: ReactNode
  /** Deep-link to the fixing surface. Rendered primary on critical signals. */
  fix?: { label: string; onAction: () => void }
  /**
   * Whether the signal offers the acknowledge affordance (persisted per user
   * upstream). Defaults to true for critical signals, false otherwise —
   * critical signals acknowledge, warn/info dismiss (session-scoped).
   */
  ackable?: boolean
}

export interface AttentionCornerLabels {
  /** Pill label next to the severity counts. */
  needAttention: string
  /** Pill label when no live signals remain. */
  allClear: string
  /** Shade eyebrow, e.g. "Needs attention". */
  region: string
  minimize: string
  /** Acknowledge button ("Got it"). */
  acknowledge: string
  /** Acknowledged chip (click to undo). */
  acknowledged: string
  acknowledgedHint: string
  dismiss: string
  /** Empty-state line when everything is resolved/dismissed. */
  emptyTitle: string
}

export const DEFAULT_ATTENTION_LABELS: AttentionCornerLabels = {
  needAttention: 'need attention',
  allClear: 'All clear',
  region: 'Needs attention',
  minimize: 'Minimize',
  acknowledge: 'Got it',
  acknowledged: 'Acknowledged',
  acknowledgedHint: 'Acknowledged — click to undo',
  dismiss: 'Dismiss',
  emptyTitle: 'You’re all caught up.',
}
