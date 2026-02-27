import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { AdminDashboard } from '../dashboards/AdminDashboard'

type AdminState = 'overview' | 'multi-campus' | 'hr' | 'analytics'

const sections: ScrollSection<AdminState>[] = [
  {
    id: 1,
    state: 'overview',
    headline: 'Strategic Resource Allocation',
    body: 'Transform financial data into actionable insights. Monitor real-time budget utilization across all departments, identify cost-saving opportunities, and ensure every dollar directly contributes to student success. Our predictive models help you plan for future fiscal years with confidence.',
    badge: 'Financial Intelligence',
  },
  {
    id: 2,
    state: 'multi-campus',
    headline: 'Unified District Operations',
    body: 'Orchestrate operations across your entire district from a single pane of glass. Standardize best practices, monitor campus health metrics in real-time, and ensure equitable resource distribution while respecting the unique culture of each school community.',
    badge: 'District-Wide Control',
  },
  {
    id: 3,
    state: 'hr',
    headline: 'High-Performance Workforce',
    body: 'Build and retain a world-class educational team. Track certification compliance, analyze teacher retention trends, and identify professional development needs. Empower your HR team to make data-backed hiring decisions that elevate educational outcomes.',
    badge: 'Talent Management',
  },
  {
    id: 4,
    state: 'analytics',
    headline: 'Predictive Decision Intelligence',
    body: 'Move from reactive to proactive management. Leverage AI-driven analytics to forecast enrollment trends, predict student performance outcomes, and intervene early. Turn complex data sets into clear, strategic narratives for stakeholders and board meetings.',
    badge: 'Future-Ready Insights',
  },
]

export function DistrictLeadersSection() {
  return (
    <ScrollytellingSection<AdminState>
      sections={sections}
      sectionTag="For District Leaders"
      sectionTitle={
        <>
          Command Your District with <span className="text-primary">Confidence</span>
        </>
      }
      sectionSubtitle="A comprehensive command center designed for superintendents and administrators to drive operational excellence and educational equity."
      dashboard={AdminDashboard}
    />
  )
}
