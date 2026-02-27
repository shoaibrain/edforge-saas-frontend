import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { StudentDashboard } from '../dashboards/StudentDashboard'

type StudentState = 'learning' | 'engagement' | 'achievements' | 'personalized'

const sections: ScrollSection<StudentState>[] = [
  {
    id: 1,
    state: 'learning',
    headline: 'All your courses, one place',
    body: 'See every class, track progress by subject, and pick up where you left off. No hunting through multiple apps.',
    badge: 'My Courses',
  },
  {
    id: 2,
    state: 'engagement',
    headline: 'Earn as you learn',
    body: 'Points, streaks, and badges for consistent effort. See where you rank in your class. Build habits that last.',
    badge: 'Achievements',
  },
  {
    id: 3,
    state: 'achievements',
    headline: 'Grades you can understand',
    body: 'See your overall GPA, subject breakdown, and recent achievements in one clean view. No surprises at report card time.',
    badge: 'My Grades',
  },
  {
    id: 4,
    state: 'personalized',
    headline: 'Know what to focus on',
    body: 'Personalized recommendations based on your performance. See which subjects need attention and what to study next.',
    badge: 'For You',
  },
]

export function StudentSection() {
  return (
    <ScrollytellingSection<StudentState>
      sections={sections}
      sectionTag="For Students"
      sectionTitle={
        <>
          Students see their{' '}
          <span style={{ color: 'var(--lp-chart-primary)' }}>own progress.</span>
        </>
      }
      sectionSubtitle="Grades, assignments, schedules, and achievements — all in a student portal built for clarity, not clutter."
      dashboard={StudentDashboard}
      variant="skeleton"
    />
  )
}
