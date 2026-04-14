/**
 * PortalScheduleCourseCard — Specific split-tone card design for the Schedule page.
 * Displays meeting times, rooms, and assignments.
 */

import { MessageSquare, ArrowUpRight } from 'lucide-react'

export interface PortalScheduleCourseCardProps {
  courseName: string
  courseCode?: string
  teacherName?: string
  timeStr: string      // e.g. "Mon, Wed, Fri · 10:00–10:50 am"
  roomStr?: string     // e.g. "Room 8"
  locationStr?: string // e.g. "Ground floor, east wing"
  assignmentsDue?: number
  isMath?: boolean     // used to determine blue vs red split tone
}

export function PortalScheduleCourseCard({
  courseName,
  courseCode,
  teacherName,
  timeStr,
  roomStr,
  locationStr,
  assignmentsDue = 0,
  isMath = false
}: PortalScheduleCourseCardProps) {
  
  const colorClass = isMath ? 'blue' : 'red'

  return (
    <div className="fp-sch-course">
      {/* Top Half Banner */}
      <div className={`fp-sch-course-head ${colorClass}`}>
         <h4>{courseCode}</h4>
         <h2>{courseName}</h2>
         <span>Grade 1 • Elementary {courseName.split(' ')[0]}</span>
      </div>

      {/* Bottom Half Info */}
      <div className="fp-sch-course-body">
         <div className="fp-sch-course-row">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
           <div>
             <span>{timeStr}</span>
           </div>
         </div>
         
         <div className="fp-sch-course-row">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           <div>
             <span>{roomStr ?? 'TBD'}</span>
             <em>{locationStr ?? ''}</em>
           </div>
         </div>

         {assignmentsDue > 0 && (
           <div className="fp-sch-course-row">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
             <div>
               <span><strong>{assignmentsDue} assignment{assignmentsDue > 1 ? 's' : ''}</strong> due</span>
               <em>This week</em>
             </div>
           </div>
         )}
      </div>

      {/* Footer Interface */}
      <div className="fp-sch-course-foot">
         <div className="flex items-center gap-3">
           <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMath ? 'var(--fp-indigo)' : 'var(--fp-sage)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 500, fontFamily: 'var(--fp-font-sans)' }}>
             {teacherName?.charAt(0) ?? 'T'}
           </div>
           <div className="flex flex-col">
             <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fp-ink)' }}>{teacherName ?? 'Teacher TBD'}</span>
             <span style={{ fontSize: 11, color: 'var(--fp-ink-3)', opacity: .8, textTransform: 'uppercase', letterSpacing: '.05em' }}>{courseName.split(' ')[0]} Teacher</span>
           </div>
         </div>

         <div className="flex gap-2">
           <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 99, border: 0, background: 'var(--fp-ink)', color: 'var(--fp-paper)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--fp-font-sans)', cursor: 'pointer' }}>
             <MessageSquare size={13} fill="currentColor" /> {isMath ? 'Message' : 'Reply'}
           </button>
           <button style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--fp-hairline)', background: 'transparent', color: 'var(--fp-ink)', cursor: 'pointer' }}>
             <ArrowUpRight size={14} />
           </button>
         </div>
      </div>
    </div>
  )
}
