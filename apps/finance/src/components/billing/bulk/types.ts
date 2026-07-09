/**
 * Bulk Generate Invoices — wizard-internal types.
 *
 * Phase 1 (operator-validated prototype import). All types are local to the
 * wizard — they intentionally do NOT depend on shared-types versions so the
 * wizard can ship before / independent of any @aibrains/shared-types minor
 * bump. The backend's bulkGenerateInvoiceSchema accepts unknown optional
 * fields silently (Zod default .strip()), so a partial backend deploy
 * degrades gracefully (new optional fields are ignored).
 */

import type { StudentSearchResult } from '@edforge/finance-services'
import type { FeeStructure } from '@edforge/types'

// ---------------------------------------------------------------------------
// Selection state — the wizard's persistent recipient set
// ---------------------------------------------------------------------------

/**
 * Which picker view is active. Selection survives switches between modes.
 * Segments are a third axis layered on top — operator picks individuals
 * and/or whole grades and/or a smart segment; the resulting recipient set
 * is the UNION.
 */
export type SelectionMode = 'student' | 'grade'

/**
 * Smart-segment chip IDs the operator can toggle. Phase 1 ships only the
 * three derivable-from-finance segments enabled; the rest render greyed
 * with a "coming Phase 2" tooltip because they require student demographic
 * fields that EdForge doesn't have yet (scholarship / BPL / boarder /
 * transport user / disability flags).
 */
export type SegmentId =
  | 'outstanding'
  | 'new'
  | 'not-billed-this-period'
  // Phase 2 (greyed in Phase 1):
  | 'transport'
  | 'boarders'
  | 'scholarship'

/**
 * The single source of truth for "who gets an invoice." A flat Set of
 * studentIds resolved from individual ticks + grade-group ticks + segment
 * applications. Wizard submits this set directly as `studentIds[]` with
 * `selectionMode: 'students'` — the backend doesn't need to know how the
 * set was built.
 */
export interface SelectionState {
  /** Currently active picker view (for the operator's lens; does NOT filter the selected set). */
  mode: SelectionMode
  /** Flat resolved studentIds. */
  selectedIds: Set<string>
  /** Which smart-segment chips are currently toggled on. */
  activeSegments: Set<SegmentId>
}

export function emptySelection(): SelectionState {
  return {
    mode: 'grade',
    selectedIds: new Set<string>(),
    activeSegments: new Set<SegmentId>(),
  }
}

// ---------------------------------------------------------------------------
// Fee selection + custom lines (Step 2)
// ---------------------------------------------------------------------------

export interface CustomLine {
  /** Stable local ID for React keying; NOT sent to backend. */
  id: string
  name: string
  /** Raw text from the input; coerced via Number() at submit time so a
   *  half-typed value doesn't NaN-poison the live rail. */
  amount: string
}

/**
 * feeStructureId → selected marker. The backend's bulkGenerateInvoiceSchema
 * carries no per-fee options (no discounts field — discounts apply only on
 * the single-invoice generate path), so selection is a plain membership set.
 */
export type SelectedFeesMap = Record<string, true>

// ---------------------------------------------------------------------------
// Step 3 — invoice details
// ---------------------------------------------------------------------------

export interface WizardDetails {
  academicYear: string
  billingPeriod: string // operator-chosen, free-form (e.g. "First Term", "2026-04")
  dueDate: string // YYYY-MM-DD
  notes: string
  /** When true, BE drops students whose projected total is 0 (e.g. a
   *  zero-amount fee structure). Counted toward `skipped`. */
  skipZeroTotal: boolean
  /** When true, Step 4 shows the per-student preview list. Pure UI toggle. */
  showPreview: boolean
}

export function defaultDetails(): WizardDetails {
  // Default due-date = today + 30d
  const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  return {
    academicYear: '',
    billingPeriod: '',
    dueDate: due,
    notes: '',
    skipZeroTotal: true,
    showPreview: true,
  }
}

// ---------------------------------------------------------------------------
// Computed invoice projections (Steps 2 + 4)
// ---------------------------------------------------------------------------

export interface ComputedLine {
  /** Stable React key. */
  key: string
  name: string
  feeStructureId?: string // present for fee-structure lines; absent for custom
  base: number
  total: number
  isCustom?: boolean
}

export interface ComputedInvoice {
  studentId: string
  studentName: string
  gradeLevel: string
  lines: ComputedLine[]
  subtotal: number
  total: number
}

export interface ComputedBatch {
  perStudent: ComputedInvoice[]
  /** Sum of per-student totals BEFORE skipZeroTotal filtering. */
  grossTotal: number
  /** Sum AFTER skipZeroTotal filtering (if enabled). */
  billableTotal: number
  /** Students whose projected total = 0 (filtered out when skipZeroTotal:true). */
  zeroCount: number
  /** Average billable per student. 0 when no billable students. */
  avgPerStudent: number
}

// ---------------------------------------------------------------------------
// Wizard step indicator
// ---------------------------------------------------------------------------

export type WizardStep = 0 | 1 | 2 | 3

// ---------------------------------------------------------------------------
// Re-exports — convenience so wizard files import everything from one place.
// ---------------------------------------------------------------------------

export type { StudentSearchResult, FeeStructure }
