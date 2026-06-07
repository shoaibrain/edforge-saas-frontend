/**
 * Pure helpers for exam component (Theory/Practical/…) splits + per-component
 * score entry. Extracted from the Subjects/Scores tabs so they're unit-testable
 * and don't trip react-refresh (component files should export only components).
 */

import type { ExamComponentDto } from '@aibrains/shared-types'

/** One Theory/Practical (or custom) component row in the Add-Subject form. */
export interface ComponentDraft {
  label: string
  fullMarks: string
  passMarks: string
}

/** Derive a stable component code from its label (theory/practical/custom). */
export function slugifyCode(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20)
}

/**
 * Build + validate the components payload from the draft rows. Mirrors the
 * server refine: Σ fullMarks === maxMarks, each passMarks ≤ fullMarks, unique
 * non-empty codes. Returns null (ok:false) when invalid so the caller blocks submit.
 */
export function buildComponents(
  drafts: ComponentDraft[],
  maxMarks: number,
): { ok: true; components: ExamComponentDto[] } | { ok: false } {
  if (drafts.length === 0) return { ok: true, components: [] }
  const out: ExamComponentDto[] = []
  const seen = new Set<string>()
  let sum = 0
  for (const d of drafts) {
    const label = d.label.trim()
    const code = slugifyCode(label)
    const fullMarks = Number(d.fullMarks)
    const passMarks = Number(d.passMarks)
    if (!label || !code || seen.has(code)) return { ok: false }
    if (!Number.isFinite(fullMarks) || fullMarks < 1) return { ok: false }
    if (!Number.isFinite(passMarks) || passMarks < 0 || passMarks > fullMarks) return { ok: false }
    seen.add(code)
    sum += fullMarks
    out.push({ code, label, fullMarks, passMarks })
  }
  if (sum !== maxMarks) return { ok: false }
  return { ok: true, components: out }
}

/**
 * Evaluate an enrollment's per-component inputs against the subject's component
 * defs. `complete` = every component has a valid in-range value; `anyFilled` =
 * at least one; `invalid` = a present value is non-numeric or out of range.
 */
export function evalComponents(
  defs: ExamComponentDto[],
  row: { components?: Record<string, string> } | undefined,
): { sum: number; complete: boolean; anyFilled: boolean; invalid: boolean; scores: Record<string, number> } {
  let sum = 0
  let anyFilled = false
  let invalid = false
  let filled = 0
  const scores: Record<string, number> = {}
  for (const d of defs) {
    const t = (row?.components?.[d.code] ?? '').trim()
    if (t === '') continue
    anyFilled = true
    const n = Number(t)
    if (!Number.isFinite(n) || n < 0 || n > d.fullMarks) {
      invalid = true
      continue
    }
    filled++
    scores[d.code] = n
    sum += n
  }
  return { sum, complete: filled === defs.length && !invalid, anyFilled, invalid, scores }
}

/** Whether two component-score maps are equal (for change detection). */
export function sameComponentScores(
  a: Record<string, number> | undefined,
  b: Record<string, number>,
): boolean {
  const ak = Object.keys(a ?? {})
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  for (const k of bk) if ((a ?? {})[k] !== b[k]) return false
  return true
}
