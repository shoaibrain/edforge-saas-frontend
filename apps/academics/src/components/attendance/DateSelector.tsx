/**
 * DateSelector Component
 *
 * Date picker with previous/next navigation and today shortcut.
 * Disables future dates for attendance recording.
 */

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatBSLong, adToBS } from '../../lib/bikram-sambat'

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}

export function DateSelector({
  selectedDate,
  onDateChange,
  onPrevious,
  onNext,
  onToday,
}: DateSelectorProps) {
  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today
  const isFutureDisabled = selectedDate >= today

  const displayDate = new Date(selectedDate + 'T00:00:00')
  const formattedDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Task 5.6: Bikram Sambat date display
  const bsDateLabel = useMemo(() => {
    return formatBSLong(adToBS(selectedDate))
  }, [selectedDate])

  return (
    <div className="flex items-center gap-3">
      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrevious}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isFutureDisabled}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Date Display & Picker */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => onDateChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Select date"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <div>
              <span className="text-sm font-medium text-text-primary block">{formattedDate}</span>
              {/* Task 5.6: BS date below Gregorian */}
              <span className="text-xs text-text-tertiary block">{bsDateLabel} BS</span>
            </div>
          </div>
        </div>

        {!isToday && (
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--state-info-bg)/0.18)] hover:bg-[rgb(var(--state-info-bg)/0.26)] dark:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--state-info-fg)/0.2)]  rounded-lg transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {isToday && (
        <span className="px-2 py-0.5 text-xs font-medium text-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-bg)/0.18)]  rounded-full">
          Today
        </span>
      )}
    </div>
  )
}
