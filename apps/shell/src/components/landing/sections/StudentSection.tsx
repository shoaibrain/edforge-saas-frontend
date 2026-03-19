import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { StudentDashboard } from '../dashboards/StudentDashboard'
import { BookOpen, Trophy, GraduationCap, Target } from 'lucide-react'

type StudentState = 'learning' | 'engagement' | 'achievements' | 'personalized'

const sections: ScrollSection<StudentState>[] = [
  {
    id: 1,
    state: 'learning',
    headline: 'All your courses, one place',
    body: 'See every class, track progress by subject, and pick up where you left off. No hunting through multiple apps.',
    badge: 'My Courses',
    icon: BookOpen,
    summary: 'Every class and subject progress in one view.',
    span: 'wide',
  },
  {
    id: 2,
    state: 'engagement',
    headline: 'Earn as you learn',
    body: 'Points, streaks, and badges for consistent effort. See where you rank in your class. Build habits that last.',
    badge: 'Achievements',
    highlightWords: ['Earn'],
    icon: Trophy,
    summary: 'Points, streaks, and badges for consistent effort.',
  },
  {
    id: 3,
    state: 'achievements',
    headline: 'Grades you can understand',
    body: 'See your overall GPA, subject breakdown, and recent achievements in one clean view. No surprises at report card time.',
    badge: 'My Grades',
    icon: GraduationCap,
    summary: 'GPA, subjects, and achievements at a glance.',
  },
  {
    id: 4,
    state: 'personalized',
    headline: 'Know what to focus on',
    body: 'Personalized recommendations based on your performance. See which subjects need attention and what to study next.',
    badge: 'For You',
    highlightWords: ['focus'],
    icon: Target,
    summary: 'AI recommendations based on your performance.',
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
          <span className="text-[var(--lp-accent-blue)]">own progress.</span>
        </>
      }
      sectionSubtitle="Grades, assignments, schedules, and achievements — all in a student portal built for clarity, not clutter."
      dashboard={StudentDashboard}
      variant="skeleton"
      accentColor="var(--lp-accent-blue)"
      accentBg="var(--lp-accent-blue-light)"
    />
  )
}
