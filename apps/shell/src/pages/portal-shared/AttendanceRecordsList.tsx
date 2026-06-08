/**
 * AttendanceRecordsList — Recent attendance records styled per the family portal prototype
 */

import { useState } from 'react'
import { useTranslation } from '@edforge/i18n'
import type { AttendanceRecord } from '../../hooks/usePortalStudentAttendance'

export interface AttendanceRecordsListProps {
  records?: AttendanceRecord[]
  loading?: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function AttendanceRecordsList({
  records,
  loading,
}: AttendanceRecordsListProps) {
  const { t } = useTranslation('portal')
  const [showAll, setShowAll] = useState(false)

  if (loading || !records || records.length === 0) {
    return (
      <section className="fp-section h-full flex flex-col">
        <div className="fp-section-head">
          <h2 className="fp-section-title">Recent <em>records</em></h2>
        </div>
        <div className="fp-timeline-card flex-1 flex items-center justify-center">
          <p style={{ color: 'var(--fp-ink-3)', fontStyle: 'italic', fontVariationSettings: '"SOFT" 30', fontFamily: 'var(--fp-font-display)' }}>
             {loading ? 'Loading...' : t('attendance.noRecords')}
          </p>
        </div>
      </section>
    )
  }

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const visible = showAll ? sorted : sorted.slice(0, 4)

  return (
    <section className="fp-section h-full flex flex-col">
      <div className="fp-section-head">
        <h2 className="fp-section-title">Recent <em>records</em></h2>
      </div>
      
      <div className="fp-timeline-card flex-1">
        <div className="flex flex-col">
          {visible.map((rec) => {
             let bgClass = 'var(--fp-paper)';
             let colorClass = 'var(--fp-ink-3)';
             let explainText = rec.notes ? rec.notes : '';

             if (rec.status === 'absent') {
               bgClass = 'var(--fp-rose)'; colorClass = 'var(--fp-terracotta)';
               if (!rec.notes) explainText = 'No reason on file - check-in needed';
             } else if (rec.status === 'present') {
               bgClass = 'var(--fp-sage-soft)'; colorClass = 'var(--fp-sage)';
               if (!rec.notes) explainText = 'Both periods attended';
             } else if (rec.status === 'late') {
               bgClass = 'var(--fp-butter-soft)'; colorClass = 'var(--fp-butter)';
               if (!rec.notes) explainText = 'Arrived late - check details';
             } else if (rec.status === 'excused') {
               bgClass = 'var(--fp-indigo-soft)'; colorClass = 'var(--fp-indigo)';
             }

             // Parse date
             const [wk, ...rest] = formatDate(rec.date).split(' ')
             const md = rest.join(' ')

             return (
               <div key={rec.id} className="fp-t-row border-b-0 py-4" style={{ borderRadius: 0, paddingLeft: 0, paddingRight: 0 }}>
                 
                 {/* Left Date */}
                 <div className="fp-t-num flex flex-col items-start min-w-12">
                   <span style={{ fontSize: '10px', marginTop: 0 }}>{wk}</span>
                   <div style={{ color: 'var(--fp-ink-3)', fontSize: '12px' }}>{md}</div>
                 </div>

                 {/* Middle Content */}
                 <div className="fp-t-body pl-2">
                   <strong>{rec.status === 'present' ? 'Arrived on time' : rec.status === 'absent' ? 'Full day absent' : rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}</strong>
                   <span style={{ textTransform: 'none', letterSpacing: '0', fontSize: '12px' }}>{explainText}</span>
                 </div>

                 {/* Right Status Pill */}
                 <div>
                    <span style={{ background: bgClass, color: colorClass, padding: '4px 12px', borderRadius: '12px', fontFamily: 'var(--fp-font-mono)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {rec.status}
                    </span>
                 </div>
               </div>
             )
          })}
        </div>
        
        {!showAll && sorted.length > 4 && (
          <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px dashed var(--fp-hairline)' }}>
            <button 
              onClick={() => setShowAll(true)}
              style={{ color: 'var(--fp-ink-3)', fontSize: '12px', fontFamily: 'var(--fp-font-sans)', border: 0, background: 'none', cursor: 'pointer', fontStyle: 'italic', opacity: .8 }}  
            >
              See {sorted.length - 4} older records ↓
            </button>
          </div>
        )}

      </div>
    </section>
  )
}
