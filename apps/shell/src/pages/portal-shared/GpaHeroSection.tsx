/**
 * Portal GpaHeroSection — Split layout with GPA ring + narrative + stats
 * Matched precisely to the prototype's .fp-progress-hero DOM and styling.
 */

import type { StudentGradesResponseDto } from '@aibrains/shared-types'
import { Skeleton } from '@edforge/ui'

export interface GpaHeroSectionProps {
  data?: StudentGradesResponseDto | null
  loading?: boolean
  childName?: string
}

export function GpaHeroSection({ data, loading, childName }: GpaHeroSectionProps) {
  if (loading) {
    return (
      <section className="fp-progress-hero" style={{ padding: '40px 44px' }}>
        <div className="flex gap-8 items-center w-full">
          <Skeleton className="w-[200px] h-[200px] rounded-full shrink-0" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-8 mt-6">
              <Skeleton className="h-14 w-20" />
              <Skeleton className="h-14 w-20" />
              <Skeleton className="h-14 w-20" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const gpa = data?.gpa
  const grades = data?.grades ?? []
  const courseCount = grades.length
  const gradedCount = grades.filter((g) => g.letterGrade != null).length
  const totalCredits = gpa?.totalCredits ?? 0

  let narrativeTitle: React.ReactNode
  let narrativeBody = ''
  
  const firstName = childName || 'Student'

  if (courseCount === 0) {
    narrativeTitle = <>No courses underway yet.</>
    narrativeBody = `Once ${firstName} is enrolled in courses, their progress will appear here.`
  } else if (gradedCount === 0) {
    narrativeTitle = <>{courseCount} course{courseCount > 1 ? 's' : ''} underway. <em>No early marks yet.</em></>
    narrativeBody = `${firstName} is a few weeks into the term. Teachers are still gathering their first round of work. The GPA will start to take shape once three or four assignments come in from each course — expect that around mid-term.`
  } else {
    narrativeTitle = <>{courseCount} course{courseCount > 1 ? 's' : ''} underway. <em>{gradedCount} graded</em> so far.</>
    narrativeBody = `Teachers are starting to post grades. The GPA is forming but remember nothing is cast in stone until the definitive report card.`
  }

  const cumulativeValue = gpa?.cumulativeGpa ? gpa.cumulativeGpa.toFixed(2) : ''
  const hasMarks = cumulativeValue.length > 0;
  
  // Dash array circle calculation roughly for a 260px SVG. r = 110, circumference = 691.
  // 691 * (GPA / 4) offset calculation
  const offset = hasMarks ? 691 - (((gpa?.cumulativeGpa ?? 0) / 4.0) * 691) : 691;

  return (
    <section className="fp-progress-hero">
      <div className="fp-ring-wrap">
        <svg viewBox="0 0 260 260">
          <defs>
            <linearGradient id="fp-g-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--fp-plum)"/>
              <stop offset="55%" stopColor="var(--fp-terracotta)"/>
              <stop offset="100%" stopColor="var(--fp-butter)"/>
            </linearGradient>
          </defs>
          <circle cx="130" cy="130" r="110" fill="none" stroke="var(--fp-paper-2)" strokeWidth="14"/>
          <circle 
            cx="130" 
            cy="130" 
            r="110" 
            fill="none" 
            stroke="url(#fp-g-grad)" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeDasharray="691" 
            strokeDashoffset={offset} 
            transform="rotate(-90 130 130)"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="fp-ring-center">
          <div className={`fp-ring-num ${hasMarks ? '' : 'empty'}`}>
            {hasMarks ? cumulativeValue : '—'}
          </div>
          <div className="fp-ring-label">Term GPA</div>
        </div>
        <div className="fp-ring-caption">
           {hasMarks ? 'Current Standing' : 'Awaiting first grades'}
        </div>
      </div>
      
      <div className="fp-hero-right">
        <div className="fp-page-eyebrow">The short version</div>
        <h2 className="fp-narrative">
          {narrativeTitle}
        </h2>
        <p className="fp-narrative-body">
          {narrativeBody}
        </p>
        <div className="fp-hero-stats">
          <div className="fp-hero-stat">
            <div className="fp-hero-stat-label">Credits</div>
            <div className={`fp-hero-stat-val ${totalCredits > 0 ? '' : 'empty'}`}>{totalCredits > 0 ? totalCredits : '—'}</div>
          </div>
          <div className="fp-hero-stat">
            <div className="fp-hero-stat-label">Courses</div>
            <div className="fp-hero-stat-val">{courseCount}<em>active</em></div>
          </div>
          <div className="fp-hero-stat">
            <div className="fp-hero-stat-label">Graded items</div>
            <div className="fp-hero-stat-val">{gradedCount}<em>so far</em></div>
          </div>
        </div>
      </div>
    </section>
  )
}
