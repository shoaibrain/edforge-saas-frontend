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

const CHIPS: { key: RosterFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unmarked', label: 'Unmarked' },
  { key: 'absent', label: 'Absent' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'locked', label: 'Locked' },
]

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
  const chips = CHIPS.filter((c) => c.key !== 'locked' || showLockedChip)
  const presentLabel = bulkScopeCount == null ? 'All Present' : `Mark ${bulkScopeCount} Present`
  const absentLabel = bulkScopeCount == null ? 'All Absent' : `Mark ${bulkScopeCount} Absent`

  return (
    <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border-secondary bg-surface-primary px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search students..."
            aria-label="Search students by name or number"
            prefix={<Search className="h-4 w-4" />}
            suffix={
              search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className={`rounded p-0.5 text-text-tertiary transition-colors hover:text-text-primary ${focusRingInset}`}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

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
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Filter students">
        {chips.map((c) => {
          const active = activeFilter === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onFilterChange(c.key)}
              aria-pressed={active}
              className={`flex flex-shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-2xs font-medium transition-colors ${focusRingInset} ${
                active
                  ? 'border-[rgb(var(--accent-academics)/0.2)] bg-[rgb(var(--accent-academics)/0.1)] text-[#378ADD]'
                  : 'border-transparent bg-surface-secondary text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {c.label}
              <span className="tabular-nums opacity-70">{counts[c.key]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
