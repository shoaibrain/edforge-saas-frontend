/**
 * PortalWeekTimetable — Beautifully rendered time-lattice week calendar.
 * Binds periods to chronological rows, matching prototype exactness.
 */

import { useMemo } from 'react'
import type { TimetableSlot, TimetableClassBlock } from '@edforge/ui'

export interface PortalWeekTimetableProps {
  periods: TimetableSlot[]
  blocks: TimetableClassBlock[]
  weekStartDate: string // e.g. '2026-04-06' (Monday)
}

function parseHour(timeLabel: string) {
  // e.g. "10:00:00" -> 10
  return parseInt(timeLabel.split(':')[0], 10)
}

function formatHourLabel(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const hr = h % 12 || 12
  return `${hr} ${ampm}`
}

export function PortalWeekTimetable({
  periods,
  blocks,
  weekStartDate,
}: PortalWeekTimetableProps) {
  
  // Calculate days for the header (Mon -> Fri)
  const days = useMemo(() => {
    const monday = new Date(weekStartDate)
    return Array.from({ length: 5 }).map((_, i) => {
      const dt = new Date(monday)
      dt.setDate(dt.getDate() + i)
      return {
        iso: dt.toISOString().slice(0, 10),
        dayName: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dt.getDay()],
        dateNum: dt.getDate(),
        // Mock a 'Today' active state by checking if it's currently that date
        isActive: new Date().toDateString() === dt.toDateString()
      }
    })
  }, [weekStartDate])

  // Get distinct hours for Y axis
  // Alternatively map each period to a row if hours are irregular.
  // The prototype maps exact hour marks. Let's map periods to rows.
  const rows = useMemo(() => {
    return [...periods].sort((a,b) => parseHour(a.startTime) - parseHour(b.startTime))
  }, [periods])

  // Helper to lookup block
  const getBlockStyles = (blockName: string) => {
    const n = blockName.toLowerCase()
    if (n.includes('break') || n.includes('recess') || n.includes('lunch')) {
      return 'break'
    }
    if (n.includes('math') || n.includes('arithmetic')) return 'blue'
    if (n.includes('chem') || n.includes('science')) return 'red'
    return 'green' // Default (homeroom, abstract)
  }

  return (
    <div className="fp-timetable-wrap">
      <div className="fp-tt-grid">
        {/* Header Row */}
        <div className="fp-tt-header">
           <div /> {/* Top left empty */}
           {days.map(d => (
             <div key={d.iso} className="fp-tt-col">
               <div className="fp-tt-col-day">{d.dayName}</div>
               <div className={`fp-tt-col-date ${d.isActive ? 'active' : ''}`}>{d.dateNum}</div>
             </div>
           ))}
        </div>

        {/* Timeline Rows */}
        {rows.map((period) => {
          const hour = parseHour(period.startTime)

          return (
            <div key={period.periodNumber} className="fp-tt-row">
              <div className="fp-tt-time text-right pr-4">
                 {/* Only print time if it's the first period of that hour, or always */}
                 {formatHourLabel(hour)}
              </div>

              {/* Find block per day */}
              {[1, 2, 3, 4, 5].map(dayNum => {
                const block = blocks.find(b => b.periodNumber === period.periodNumber && b.dayOfWeek === dayNum)

                if (!block) {
                  return <div key={dayNum} className="fp-tt-block empty" />
                }

                const style = getBlockStyles(block.courseName)
                
                if (style === 'break') {
                   return (
                     <div key={dayNum} className="fp-tt-block break">
                       {block.courseName}
                     </div>
                   )
                }

                return (
                  <div key={dayNum} className={`fp-tt-block ${style}`}>
                    <h4>{block.courseName}</h4>
                    <span>Rm {block.room ?? 'TBD'} • {block.teacherName?.split(' ').pop()}</span>
                  </div>
                )
              })}
            </div>
          )
        })}

      </div>
    </div>
  )
}
