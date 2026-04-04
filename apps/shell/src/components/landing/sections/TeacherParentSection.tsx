import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { TeacherParentDashboard } from '../dashboards/TeacherParentDashboard'
import { CalendarDays, MessageCircle, BarChart3, Users } from 'lucide-react'

type TeacherParentState = 'classroom' | 'communication' | 'progress' | 'collaboration'

const sections: ScrollSection<TeacherParentState>[] = [
  {
    id: 1,
    state: 'classroom',
    headline: 'Your class, organized',
    body: "See today's schedule, mark attendance, and log formative assessments without switching tools. One screen for your entire teaching day.",
    badge: 'Classroom Hub',
    highlightWords: ['organized'],
    icon: CalendarDays,
    summary: 'Schedule, attendance, and assessments in one screen.',
    span: 'wide',
  },
  {
    id: 2,
    state: 'communication',
    headline: 'Messages that reach families',
    body: 'Send updates to parents directly from the gradebook. Parents get real-time notifications when grades post or attendance is recorded.',
    badge: 'Communication',
    icon: MessageCircle,
    summary: 'Direct parent updates from the gradebook.',
  },
  {
    id: 3,
    state: 'progress',
    headline: 'Student progress, visualized',
    body: 'Track mastery by subject with clear progress bars. Identify students who need attention before parent-teacher conferences.',
    badge: 'Progress Tracking',
    icon: BarChart3,
    summary: 'Subject mastery tracking with visual progress bars.',
  },
  {
    id: 4,
    state: 'collaboration',
    headline: 'Parents stay involved',
    body: "Parents see the same data teachers see. Conference scheduling, assignment tracking, and daily summaries — no phone tag required.",
    badge: 'Family Portal',
    highlightWords: ['involved'],
    icon: Users,
    summary: 'Shared data, conference scheduling, daily summaries.',
  },
]

export function TeacherParentSection() {
  return (
    <ScrollytellingSection<TeacherParentState>
      sections={sections}
      sectionTag="For Teachers & Parents"
      sectionTitle={
        <>
          Teachers and parents.{' '}
          <span className="text-[var(--lp-accent-green)]">Same page, same data.</span>
        </>
      }
      sectionSubtitle="Real-time grades, attendance, and class schedules — visible to both teachers and families, updated as it happens."
      dashboard={TeacherParentDashboard}
      reversed
      variant="skeleton"
      accentColor="var(--lp-accent-green)"
      accentBg="var(--lp-accent-green-light)"
    />
  )
}
