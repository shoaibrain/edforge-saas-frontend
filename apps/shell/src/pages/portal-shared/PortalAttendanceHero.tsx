/**
 * PortalAttendanceHero — Complete modular replica.
 * Enhanced UI/UX for Insight tiles with dynamic, Staff-level layout structure.
 */

import { useTranslation } from '@edforge/i18n'
import type { AttendanceSummary } from '../../hooks/usePortalStudentAttendance'
import { Skeleton } from '@edforge/ui'
import { Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

export interface PortalAttendanceHeroProps {
  summary?: AttendanceSummary
  loading?: boolean
}

export function PortalAttendanceHero({ summary, loading }: PortalAttendanceHeroProps) {
  const { t } = useTranslation('portal')

  if (loading || !summary) {
    return (
      <div className="fp-a-hero">
        <Skeleton className="h-[320px] rounded-2xl" />
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    )
  }

  const { attendanceRate, totalDays, presentDays, absentDays, lateDays, excusedDays } = summary
  
  let rateDisplay = attendanceRate != null ? `${Math.round(attendanceRate)}%` : '—%'
  
  let narrative = attendanceRate >= 95
      ? '"Excellent attendance so far. Keep up the rhythm."'
      : attendanceRate >= 90
        ? '"A good term so far. One slip is nothing — it\'s the pattern that matters."'
        : attendanceRate >= 80
          ? '"A few absences are adding up. Let\'s keep an eye out."'
          : '"Attendance pattern needs attention."'

  if (totalDays === 0) narrative = '"Awaiting first attendance records."'

  return (
    <section className="fp-a-hero">
      {/* Left Gradient Banner */}
      <div className="fp-a-hero-banner">
        <div>
          <div style={{ fontFamily: 'var(--fp-font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--fp-butter)', marginBottom: '16px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--fp-butter)', marginRight: '8px', verticalAlign: 'middle' }} />
            Term Rate
          </div>
          <h2>{rateDisplay}<span></span></h2>
          <p className="fp-a-hero-banner-sub">
            {narrative}
          </p>
        </div>
        
        <div className="fp-a-hero-stats">
          <div>
            <strong>{presentDays}</strong>
            <span>Days present</span>
          </div>
          <div>
            <strong>{absentDays}</strong>
            <span>Day absent</span>
          </div>
          <div>
            <strong>{lateDays}</strong>
            <span>Days late</span>
          </div>
        </div>
      </div>

      {/* Right Grid Tiles: Enlarged Icons for High-Fidelity UI Presentation */}
      <div className="fp-a-grid">
        
        {/* Present */}
        <div className="fp-a-tile">
           <div className="fp-a-tile-top" style={{ color: 'var(--fp-sage)', background: 'var(--fp-sage-soft)', border: '1px solid rgba(86, 126, 68, 0.2)' }}>
              <CheckCircle2 size={24} strokeWidth={2.5} />
           </div>
           <div style={{ marginTop: 'auto' }}>
             <div className="fp-a-tile-label">Present</div>
             <div className="fp-a-tile-num">{presentDays}</div>
             <div className="fp-a-tile-sub">Days this term</div>
           </div>
        </div>

        {/* Absent */}
        <div className="fp-a-tile">
           <div className="fp-a-tile-top" style={{ color: 'var(--fp-terracotta)', background: 'var(--fp-terracotta-soft)', border: '1px solid rgba(220, 107, 85, 0.2)' }}>
              {absentDays > 0 ? <AlertCircle size={24} strokeWidth={2.5} /> : <CheckCircle2 size={24} strokeWidth={2.5} />}
           </div>
           <div style={{ marginTop: 'auto' }}>
             <div className="fp-a-tile-label">Absent</div>
             <div className="fp-a-tile-num">{absentDays}</div>
             <div className="fp-a-tile-sub">{absentDays > 0 ? 'Needs explanation' : 'Perfect attendance'}</div>
           </div>
        </div>

        {/* Late */}
        <div className="fp-a-tile">
           <div className="fp-a-tile-top" style={{ color: 'var(--fp-butter)', background: 'var(--fp-butter-soft)', border: '1px solid rgba(240, 190, 95, 0.2)' }}>
              <Clock size={24} strokeWidth={2.5} />
           </div>
           <div style={{ marginTop: 'auto' }}>
             <div className="fp-a-tile-label">Late</div>
             <div className="fp-a-tile-num">{lateDays}</div>
             <div className="fp-a-tile-sub">{lateDays === 0 ? 'All on-time' : 'Tardies recorded'}</div>
           </div>
        </div>

        {/* Excused */}
        <div className="fp-a-tile">
           <div className="fp-a-tile-top" style={{ color: 'var(--fp-indigo)', background: 'var(--fp-indigo-soft)', border: '1px solid rgba(80, 100, 180, 0.2)' }}>
              <FileText size={24} strokeWidth={2.5} />
           </div>
           <div style={{ marginTop: 'auto' }}>
             <div className="fp-a-tile-label">Excused</div>
             <div className="fp-a-tile-num">{excusedDays}</div>
             <div className="fp-a-tile-sub">{excusedDays === 0 ? 'No notes' : 'Total excused'}</div>
           </div>
        </div>

      </div>
    </section>
  )
}
