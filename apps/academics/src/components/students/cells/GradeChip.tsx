/**
 * GradeChip — compact grade-level chip for the Students roster.
 *
 * Replaces the over-wide bare-text Grade column. Shows the school's local
 * grade code verbatim (PG / UKG / 6 / ECD) — the canonical CEHRD projection is
 * a report-time concern and is intentionally NOT applied here.
 */

interface GradeChipProps {
  grade?: string | null
}

export function GradeChip({ grade }: GradeChipProps) {
  if (!grade) {
    return <span className="text-xs text-[rgb(var(--text-tertiary))]">—</span>
  }
  return (
    <span
      className="inline-grid place-items-center h-6 min-w-8 px-2 rounded-[7px] text-xs font-semibold tabular-nums"
      style={{ background: 'rgba(55, 138, 221, 0.12)', color: '#378ADD' }}
      title={`Grade ${grade}`}
    >
      {grade}
    </span>
  )
}
