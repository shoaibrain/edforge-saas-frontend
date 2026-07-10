import { UseCasePanel } from '../../components/UseCasePanel'
import { USE_CASE_STUDENTS } from '../../landing.strings'
import { resolveAssetUrl, LANDING_VIDEOS } from '../../config'
import { StudentDashboard } from './StudentDashboard'

/**
 * UseCaseStudents — "A portal students actually want to open" section.
 * Feature rail left, static product dashboard right. Navy accent for visual
 * distinction from District (crimson) and Teachers (teal).
 */
export function UseCaseStudents() {
  return (
    <UseCasePanel
      sectionId={USE_CASE_STUDENTS.id}
      eyebrow={USE_CASE_STUDENTS.eyebrow}
      heading={{
        lead: USE_CASE_STUDENTS.headingLead,
        serif: USE_CASE_STUDENTS.headingSerif,
        serifColor: 'var(--lp-ink)',
        tail: USE_CASE_STUDENTS.headingTail,
      }}
      lede={USE_CASE_STUDENTS.lede}
      accent="var(--lp-ink)"
      features={USE_CASE_STUDENTS.features}
      videoSrc={resolveAssetUrl(LANDING_VIDEOS.students)}
      videoLength={USE_CASE_STUDENTS.mediaLength}
      dashboardFallback={<StudentDashboard />}
      showMode="video"
    />
  )
}
