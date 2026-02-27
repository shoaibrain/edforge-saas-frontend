import { ScrollytellingSection, type ScrollSection } from './ScrollytellingSection'
import { AdminDashboard } from '../dashboards/AdminDashboard'

type AdminState = 'overview' | 'multi-campus' | 'hr' | 'analytics'

const sections: ScrollSection<AdminState>[] = [
  {
    id: 1,
    state: 'overview',
    headline: 'Budget clarity, not spreadsheets',
    body: 'Track real-time spending against allocations for every department and campus. Surface variances before they become problems. Export board-ready reports in one click.',
    badge: 'Financial Overview',
  },
  {
    id: 2,
    state: 'multi-campus',
    headline: 'Every campus at a glance',
    body: 'Monitor enrollment, attendance, and operational health across all schools simultaneously. Drill into any campus without leaving the dashboard. Standardize reporting district-wide.',
    badge: 'Multi-Campus Ops',
  },
  {
    id: 3,
    state: 'hr',
    headline: 'Know your workforce',
    body: 'Track certification status, retention rates, and professional development hours. Identify staffing gaps before they affect classrooms. Data-driven hiring decisions.',
    badge: 'Staff & HR',
  },
  {
    id: 4,
    state: 'analytics',
    headline: 'Forecast, don\u2019t react',
    body: 'Enrollment projections, performance trends, and resource demand models. Surface risks early. Present data-backed narratives to your board with confidence.',
    badge: 'Predictive Analytics',
  },
]

export function DistrictLeadersSection() {
  return (
    <ScrollytellingSection<AdminState>
      sections={sections}
      sectionTag="For District Leaders"
      sectionTitle={
        <>
          See your entire district.{' '}
          <span style={{ color: '#2a9d8f' }}>In one place.</span>
        </>
      }
      sectionSubtitle="Budget, staffing, enrollment, and performance across every school — one dashboard, zero tab-switching."
      dashboard={AdminDashboard}
    />
  )
}
