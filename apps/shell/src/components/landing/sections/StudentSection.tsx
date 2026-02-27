import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { StudentDashboard } from '../dashboards/StudentDashboard'

type StudentState = 'learning' | 'engagement' | 'achievements' | 'personalized'

const sections: ScrollSection<StudentState>[] = [
  {
    id: 1,
    state: 'learning',
    headline: 'Interactive Skill Mastery',
    body: 'Go beyond textbooks with interactive simulations and virtual models. Explore ancient cities or conduct safe chemistry experiments. Build and create projects that encourage deeper exploration and mastery of academic concepts.',
    badge: 'Deep Learning',
  },
  {
    id: 2,
    state: 'engagement',
    headline: 'Growth Mindset & Grit',
    body: 'Frame mistakes as opportunities to learn. Develop a toolkit of strategies to apply when faced with challenges. We reward persistence and tenacity, helping you build the resilience needed to solve difficult problems.',
    badge: 'Build Character',
  },
  {
    id: 3,
    state: 'achievements',
    headline: 'Lifelong Learning Toolkit',
    body: 'Develop non-cognitive skills that are critical for long-term success. Track your growth in creativity, collaboration, and critical thinking alongside your academic achievements. Believe in your ability to improve and succeed.',
    badge: 'Skills for Life',
  },
  {
    id: 4,
    state: 'personalized',
    headline: 'Future Pathways',
    body: 'Plan your future with college-to-career maps and interactive course planning. Connect with alumni in fields that interest you to gain perspective and advice. Visualize your path to graduation and beyond.',
    badge: 'Your Future',
  },
]

export function StudentSection() {
  return (
    <ScrollytellingSection<StudentState>
      sections={sections}
      sectionTag="For Students"
      sectionTitle={
        <>
          Learn, Grow, and Achieve Your <span className="text-primary">Dreams</span>
        </>
      }
      sectionSubtitle="A learning platform that makes education fun, engaging, and perfectly tailored to help you succeed"
      dashboard={StudentDashboard}
      variant="skeleton"
    />
  )
}
