import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { TeacherParentDashboard } from '../dashboards/TeacherParentDashboard'

type TeacherParentState = 'classroom' | 'communication' | 'progress' | 'collaboration'

const sections: ScrollSection<TeacherParentState>[] = [
  {
    id: 1,
    state: 'classroom',
    headline: 'Actionable Formative Assessment',
    body: "Get quick and continual snapshots of student progress. Embedded assessments provide just-in-time feedback, allowing you to personalize learning pathways and strategically adjust instruction to meet every student's needs.",
    badge: 'Real-Time Insight',
  },
  {
    id: 2,
    state: 'communication',
    headline: 'Real-Time Family Connection',
    body: 'Bridge the home-school gap with daily progress updates and easy communication tools. Empower parents to become active, informed advocates for their children, reinforcing that learning happens everywhere, not just in school.',
    badge: 'Family Engagement',
  },
  {
    id: 3,
    state: 'progress',
    headline: 'Inclusive Support Network',
    body: 'Ensure success for every student, including those with learning disabilities or diverse backgrounds. Provide resources in home languages and help families navigate the school system, creating a truly inclusive community.',
    badge: 'Access for All',
  },
  {
    id: 4,
    state: 'collaboration',
    headline: 'Collaborative Learning Ecosystem',
    body: 'Foster partnership between educators and families through shared goals. Connect school learning to practical home activities, ensuring a supportive environment where every student can thrive academically and emotionally.',
    badge: 'Work Together',
  },
]

export function TeacherParentSection() {
  return (
    <ScrollytellingSection<TeacherParentState>
      sections={sections}
      sectionTag="For Teachers & Parents"
      sectionTitle={
        <>
          Empower Learning Through <span className="text-primary">Partnership</span>
        </>
      }
      sectionSubtitle="Tools designed for educators and families to collaborate, communicate, and celebrate student success together"
      dashboard={TeacherParentDashboard}
      reversed
      variant="skeleton"
    />
  )
}
