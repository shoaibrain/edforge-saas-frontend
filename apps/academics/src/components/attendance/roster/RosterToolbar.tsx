/**
 * RosterToolbar — sticky toolbar for the attendance roster: search + filter chips
 * + bulk actions. Lives inside the bounded grid box as a flex-shrink-0 sibling, so
 * it stays put while the list scrolls.
 *
 * Filter chips focus the teacher's task ("show me the Unmarked"). When a non-All
 * chip is active, the bulk buttons scope to that subset and say so
 * ("Mark 12 Present"), so "All Present" while filtered can't silently flip a set
 * the teacher didn't mean to.
 */

import { Search, X, CheckCircle, XCircle } from 'lucide-react'
import { Input, focusRingInset } from '@edforge/ui'
import { useAcademicsI18n } from '../../../lib/i18n'

export type RosterFilter = 'all' | 'unmarked' | 'absent' | 'flagged' | 'locked'

export interface RosterToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  activeFilter: RosterFilter
  onFilterChange: (filter: RosterFilter) => void
  counts: Record<RosterFilter, number>
  /** Hide the Locked chip outside daily_presence (no locks → dead chip). */
  showLockedChip: boolean
  canBulk: boolean
  onMarkAllPresent: () => void
  onMarkAllAbsent: () => void
  onClearAll: () => void
  /** Non-null when a non-All filter is active: how many rows bulk will affect. */
  bulkScopeCount: number | null
  markedCount: number
}

const CHIP_KEYS: RosterFilter[] = ['all', 'unmarked', 'absent', 'flagged', 'locked']

export function RosterToolbar({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
  showLockedChip,
  canBulk,
  onMarkAllPresent,
  onMarkAllAbsent,
  onClearAll,
  bulkScopeCount,
  markedCount,
}: RosterToolbarProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const chips = CHIP_KEYS.filter((key) => key !== 'locked' || showLockedChip)
  const presentLabel = bulkScopeCount == null
    ? t('attendance.toolbar.allPresent')
    : t('attendance.toolbar.markPresent', { count: formatNumber(bulkScopeCount) })
  const absentLabel = bulkScopeCount == null
    ? t('attendance.toolbar.allAbsent')
    : t('attendance.toolbar.markAbsent', { count: formatNumber(bulkScopeCount) })

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-secondary bg-surface-primary px-3 py-2.5">
      {/* Search */}
      <div className="w-full sm:w-56">
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('attendance.toolbar.search')}
          aria-label={t('attendance.toolbar.searchAria')}
          prefix={<Search className="h-4 w-4" />}
          suffix={
            search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className={`rounded p-0.5 text-text-tertiary transition-colors hover:text-text-primary ${focusRingInset}`}
                aria-label={t('attendance.toolbar.clearSearch')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto" role="group" aria-label={t('attendance.toolbar.filterAria')}>
        {chips.map((key) => {
          const active = activeFilter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              aria-pressed={active}
              className={`flex flex-shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-2xs font-medium transition-colors ${focusRingInset} ${
                active
                  ? 'border-[rgb(var(--accent-academics)/0.2)] bg-[rgb(var(--accent-academics)/0.1)] text-[#378ADD]'
                  : 'border-transparent bg-surface-secondary text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {t(`attendance.toolbar.filters.${key}`)}
              <span className="tabular-nums opacity-70">{formatNumber(counts[key])}</span>
            </button>
          )
        })}
      </div>

      {/* Bulk actions — pushed to the right end of the same line */}
      {canBulk && (
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMarkAllPresent}
            className={`flex items-center gap-1.5 rounded-lg bg-[rgb(var(--state-success-bg)/0.18)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-success-fg))] transition-colors hover:bg-[rgb(var(--state-success-bg)/0.26)] dark:hover:bg-[rgb(var(--state-success-fg)/0.2)] ${focusRingInset}`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {presentLabel}
          </button>
          <button
            type="button"
            onClick={onMarkAllAbsent}
            className={`flex items-center gap-1.5 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-danger-fg))] transition-colors hover:bg-[rgb(var(--state-danger-bg)/0.26)] dark:hover:bg-[rgb(var(--state-danger-fg)/0.2)] ${focusRingInset}`}
          >
            <XCircle className="h-3.5 w-3.5" />
            {absentLabel}
          </button>
          {markedCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className={`rounded-lg bg-surface-secondary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary ${focusRingInset}`}
            >
              {t('attendance.toolbar.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
