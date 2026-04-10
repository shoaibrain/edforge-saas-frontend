/**
 * TermSwitcher — Grading period selector button group
 *
 * Horizontal button group: "All terms" + one button per grading period.
 */

import { useTranslation } from '@edforge/i18n'
import type { GradingPeriod } from '../../hooks/usePortalCurrentAcademicYear'

export interface TermSwitcherProps {
  periods?: GradingPeriod[]
  activePeriodId: string | null
  onChange: (periodId: string | null) => void
}

export function TermSwitcher({ periods, activePeriodId, onChange }: TermSwitcherProps) {
  const { t } = useTranslation('portal')

  if (!periods || periods.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
        style={{
          background: activePeriodId === null ? 'var(--v2-brand-primary)' : 'var(--v2-surface-interactive)',
          color: activePeriodId === null ? '#fff' : 'var(--v2-text-muted)',
        }}
      >
        {t('grades.allTerms')}
      </button>
      {periods
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((period) => (
          <button
            key={period.id}
            onClick={() => onChange(period.id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              background: activePeriodId === period.id ? 'var(--v2-brand-primary)' : 'var(--v2-surface-interactive)',
              color: activePeriodId === period.id ? '#fff' : 'var(--v2-text-muted)',
            }}
          >
            {period.name}
          </button>
        ))}
    </div>
  )
}
