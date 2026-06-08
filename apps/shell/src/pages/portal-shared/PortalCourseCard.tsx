import { forwardRef, type HTMLAttributes } from 'react'

// Map a specific grade token color based on letter grade
function gradeCategory(letter?: string | null): 'high' | 'mid' | 'low' | 'pending' {
  if (!letter) return 'pending'
  const first = letter.charAt(0).toUpperCase()
  if (first === 'A' || first === 'B') return 'high'
  if (first === 'C') return 'mid'
  return 'low'
}

export interface PortalCourseCardCategory {
  name: string
  weight: number
  percentage: number
}

export interface PortalCourseCardProps extends HTMLAttributes<HTMLElement> {
  courseName: string
  courseCode?: string
  letterGrade?: string | null
  numericGrade?: number | null
  categories?: PortalCourseCardCategory[]
  teacherName?: string
  teacherInitials?: string
  teacherColor?: 'ind' | 'ter' | 'default'
  missedWorkMessage?: {
    title: string
    body: string
  }
}

export const PortalCourseCard = forwardRef<HTMLElement, PortalCourseCardProps>(
  (
    {
      className,
      courseName,
      courseCode,
      letterGrade,
      numericGrade: _numericGrade,
      categories,
      teacherName: _teacherName,
      teacherInitials: _teacherInitials,
      teacherColor = 'ind',
      missedWorkMessage,
      ...props
    },
    ref
  ) => {
    const hasGrade = letterGrade != null;
    const catClass = gradeCategory(letterGrade);

    return (
      <article
        ref={ref}
        className={`fp-course ${className ?? ''}`}
        {...props}
      >
        <div className="fp-course-head">
          <div className="fp-course-meta">
            {courseCode && (
              <div className="fp-course-code">
                <span 
                  className="dot" 
                  style={{ background: teacherColor === 'ind' ? 'var(--fp-indigo)' : 'var(--fp-terracotta)' }} 
                />
                {courseCode}
              </div>
            )}
            
            <h3 
              className="fp-course-name" 
              dangerouslySetInnerHTML={{ __html: courseName }} 
            />
          </div>
          <div className={`fp-course-grade-pill ${catClass}`}>
            {letterGrade ?? 'Not graded yet'}
          </div>
        </div>

        {/* Categories / Grade Bars */}
        {(hasGrade && categories && categories.length > 0) ? (
          <div className="fp-course-bars">
            {categories.map((cat, idx) => {
              // Decide track color based on common values or just sage
              const isLow = cat.percentage <= 50;
              const isMid = cat.percentage > 50 && cat.percentage < 75;
              const color = isLow ? 'var(--fp-terracotta)' : isMid ? 'var(--fp-butter)' : 'var(--fp-sage)';
              
              return (
                <div key={idx} className="fp-course-bar">
                  <div className="fp-course-bar-label">{cat.name}</div>
                  <div className="fp-course-bar-track">
                    <div 
                      className="fp-course-bar-fill" 
                      style={{ 
                        width: `${cat.percentage}%`, 
                        background: cat.percentage === 0 ? 'var(--fp-terracotta)' : color 
                      }} 
                    />
                  </div>
                  <div className="fp-course-bar-val">
                    {cat.percentage > 0 ? 'Good' : '0 / 1'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !hasGrade ? (
          <div className="fp-course-empty">
            <svg width="54" height="54" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="22" stroke="var(--fp-terracotta)" strokeWidth="1.5" strokeDasharray="3 3"/>
              <path d="M22 30 L28 36 L38 24" stroke="var(--fp-terracotta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/>
            </svg>
            <p className="fp-course-empty-text">Nothing graded yet</p>
          </div>
        ) : null}

        {missedWorkMessage && (
          <div style={{ fontSize: '12px', color: 'var(--fp-ink-3)', padding: '12px 14px', background: 'var(--fp-butter-soft)', borderRadius: '10px', borderLeft: '3px solid var(--fp-butter)' }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--fp-ink-2)', fontWeight: 600 }}>
              {missedWorkMessage.title}
            </strong>
            <span dangerouslySetInnerHTML={{ __html: missedWorkMessage.body }} />
          </div>
        )}

      </article>
    )
  }
)

PortalCourseCard.displayName = 'PortalCourseCard'
