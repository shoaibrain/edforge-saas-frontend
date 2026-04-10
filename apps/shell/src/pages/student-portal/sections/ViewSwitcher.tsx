/**
 * ViewSwitcher — Day/Week toggle for Student Schedule page
 *
 * Simple button group controlling which view renders.
 * No routing — local state only.
 */

import { useTranslation } from '@edforge/i18n'

export type ScheduleView = 'day' | 'week'

export interface ViewSwitcherProps {
  activeView: ScheduleView
  onChange: (view: ScheduleView) => void
}

export function ViewSwitcher({ activeView, onChange }: ViewSwitcherProps) {
  const { t } = useTranslation('portal')

  const views: Array<{ key: ScheduleView; label: string }> = [
    { key: 'day', label: t('schedule.dayView') },
    { key: 'week', label: t('schedule.weekView') },
  ]

  return (
    <div
      className="inline-flex rounded-lg p-0.5"
      style={{ background: 'var(--v2-surface-interactive)' }}
      role="tablist"
    >
      {views.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          role="tab"
          aria-selected={activeView === key}
          className="px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-colors"
          style={{
            background: activeView === key ? 'var(--v2-bg-surface)' : 'transparent',
            color: activeView === key ? 'var(--v2-text-primary)' : 'var(--v2-text-muted)',
            boxShadow: activeView === key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
