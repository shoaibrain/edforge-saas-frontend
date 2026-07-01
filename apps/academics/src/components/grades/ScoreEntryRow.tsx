/**
 * ScoreEntryRow
 *
 * Shared per-student score-entry row for the gradebook entry surfaces
 * (BulkGradeModal, AssignmentEditor). Mirrors the exams Scores-tab ScoreCell:
 * DiceBear avatar + name on the left, a right-aligned numeric input with a
 * `/ max` suffix, and a red invalid state when the value is out of range.
 */

import { UserAvatar } from '../common/UserAvatar'
import { useAcademicsI18n } from '../../lib/i18n'

export interface ScoreEntryRowProps {
  studentId: string
  studentName: string
  value: string
  onChange: (value: string) => void
  maxPoints: number
  disabled?: boolean
}

export function ScoreEntryRow({
  studentId,
  studentName,
  value,
  onChange,
  maxPoints,
  disabled,
}: ScoreEntryRowProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const num = value === '' ? null : Number(value)
  const invalid = num !== null && (isNaN(num) || num < 0 || num > maxPoints)

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <UserAvatar userId={studentId} userName={studentName} size="sm" />
        <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
          {studentName}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={maxPoints}
          step="any"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          aria-label={t('gradesModule.gradebook.scoreForStudent', { studentName })}
          aria-invalid={invalid || undefined}
          className={`w-20 rounded-lg border bg-[rgb(var(--background-secondary))] px-2.5 py-1.5 text-sm tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] disabled:opacity-50 ${
            invalid
              ? 'border-[rgb(var(--state-danger-border))] text-[rgb(var(--state-danger-fg))]'
              : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]'
          }`}
        />
        <span className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums w-10">
          / {formatNumber(maxPoints)}
        </span>
      </div>
    </div>
  )
}
