/**
 * PortalCalendarGrid — Monthly square calendar grid mimicking "April 2026 at a glance"
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HeatmapDay } from '@edforge/ui'

export interface PortalCalendarGridProps {
  yearMonth: string // "2026-04"
  days: HeatmapDay[]
  onMonthChange: (ym: string) => void
  monthLabel: string
}

export function PortalCalendarGrid({
  yearMonth,
  days,
  onMonthChange,
  monthLabel,
}: PortalCalendarGridProps) {
  
  const handlePrev = () => {
    const [y, m] = yearMonth.split('-').map(Number)
    let newM = m - 1
    let newY = y
    if (newM < 1) { newM = 12; newY-- }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`)
  }
  const handleNext = () => {
    const [y, m] = yearMonth.split('-').map(Number)
    let newM = m + 1
    let newY = y
    if (newM > 12) { newM = 1; newY++ }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`)
  }

  // Calculate grid padding
  const [y, m] = yearMonth.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1).getDay() // 0 = Sunday
  
  const pads = Array.from({ length: firstDay }).map((_, i) => i)

  return (
    <div className="fp-cal-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--fp-font-display)', fontSize: '32px', margin: 0, fontWeight: 500, letterSpacing: '-.02em', fontVariationSettings: '"SOFT" 40' }}>
          {monthLabel.split(' ')[0]} <strong>{monthLabel.split(' ')[1]}</strong> <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--fp-ink-3)', fontSize: '28px' }}>at a glance</em>
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--fp-paper)', border: '1px solid var(--fp-hairline)', borderRadius: '999px', padding: '4px', boxShadow: 'var(--fp-shadow-card)' }}>
          <button onClick={handlePrev} style={{ padding: '8px', cursor: 'pointer', border: 0, background: 'none', color: 'var(--fp-ink-3)' }}><ChevronLeft size={16} /></button>
          <span style={{ fontFamily: 'var(--fp-font-mono)', fontSize: '11px', fontWeight: 600, padding: '0 8px' }}>{monthLabel}</span>
          <button onClick={handleNext} style={{ padding: '8px', cursor: 'pointer', border: 0, background: 'none', color: 'var(--fp-ink-3)' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Grid */}
      <div className="fp-cal-grid">
         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
           <div key={d} className="fp-cal-col">{d}</div>
         ))}
         
         {pads.map(p => (
            <div key={`pad-${p}`} className="fp-cal-day empty" />
         ))}

         {days.map(day => {
           let stateClass = '';
           if (day.status === 'present') stateClass = 'present';
           else if (day.status === 'absent') stateClass = 'absent';
           else if (day.status === 'late') stateClass = 'holiday'; // Can make Late a striped yellow later
           else if (day.status === 'excused') stateClass = 'holiday'; // Can make Excused a striped blue
           else if (day.status === 'holiday') stateClass = 'holiday';

           return (
             <div key={day.date} className={`fp-cal-day ${stateClass} ${day.isToday ? 'active-req' : ''}`}>
                {day.dayNumber}
             </div>
           )
         })}
      </div>

      {/* Footer Legend */}
      <div className="fp-cal-footer">
        <div className="fp-cal-legend">
          <div className="fp-cal-legend-swatch" style={{ background: 'var(--fp-sage)' }} />
          <span>Present</span>
        </div>
        <div className="fp-cal-legend">
          <div className="fp-cal-legend-swatch" style={{ background: 'var(--fp-rose)' }} />
          <span>Absent</span>
        </div>
        <div className="fp-cal-legend">
          <div className="fp-cal-legend-swatch" style={{ background: 'var(--fp-butter)' }} />
          <span>Late</span>
        </div>
        <div className="fp-cal-legend">
          <div className="fp-cal-legend-swatch" style={{ background: 'var(--fp-indigo)' }} />
          <span>Excused</span>
        </div>
        <div className="fp-cal-legend">
          <div className="fp-cal-legend-swatch" style={{ background: 'var(--fp-sand)', backgroundImage: 'var(--fp-sand-strips)' }} />
          <span>Holiday / Weekend</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="fp-cal-legend-swatch" style={{ border: '2px solid var(--fp-paper)', background: 'transparent' }} />
          <span style={{ opacity: .5 }}>Upcoming</span>
        </div>
      </div>
    </div>
  )
}
