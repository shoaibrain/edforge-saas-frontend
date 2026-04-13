/**
 * TermSwitcher — Grading period selector button group
 *
 * Horizontal button group with prototype .fp-term-switcher classes
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
    <div className="fp-term-switcher">
      <button
        onClick={() => onChange(null)}
        className={`fp-term-opt ${activePeriodId === null ? 'active' : ''}`}
      >
        {t('grades.allTerms')}
      </button>
      {[...periods]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((period) => (
          <button
            key={period.id}
            onClick={() => onChange(period.id)}
            className={`fp-term-opt ${activePeriodId === period.id ? 'active' : ''}`}
          >
            {period.name}
          </button>
        ))}
    </div>
  )
}
