/**
 * TimeRangePicker Component
 * 
 * Input for selecting start and end times (school hours).
 * Uses native time inputs for broad browser support.
 */

import { Clock } from 'lucide-react'

interface TimeRangePickerProps {
  startTime: string // "HH:MM" format (24h)
  endTime: string
  onChange: (start: string, end: string) => void
  disabled?: boolean
}

export function TimeRangePicker({ startTime, endTime, onChange, disabled }: TimeRangePickerProps) {
  const handleStartChange = (value: string) => {
    onChange(value, endTime)
  }

  const handleEndChange = (value: string) => {
    onChange(startTime, value)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <input
          type="time"
          value={startTime}
          onChange={(e) => handleStartChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full pl-10 pr-3 py-2.5 rounded-xl
            border border-[rgb(var(--border-primary))]
            bg-[rgb(var(--surface-secondary))]
            text-sm text-[rgb(var(--text-primary))]
            focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
            transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
      
      <span className="text-[rgb(var(--text-tertiary))] text-sm font-medium">to</span>
      
      <div className="relative flex-1">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <input
          type="time"
          value={endTime}
          onChange={(e) => handleEndChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full pl-10 pr-3 py-2.5 rounded-xl
            border border-[rgb(var(--border-primary))]
            bg-[rgb(var(--surface-secondary))]
            text-sm text-[rgb(var(--text-primary))]
            focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500
            transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
    </div>
  )
}

// Helper to format time for display
export function formatTime(time: string, format: '12h' | '24h' = '12h'): string {
  if (!time) return ''
  
  const [hours, minutes] = time.split(':').map(Number)
  
  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  // 12h format
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Helper to format time range
export function formatTimeRange(start: string, end: string, format: '12h' | '24h' = '12h'): string {
  if (!start || !end) return ''
  return `${formatTime(start, format)} - ${formatTime(end, format)}`
}
