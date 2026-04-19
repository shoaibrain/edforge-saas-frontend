import { UseCasePanel } from '../../components/UseCasePanel'
import { USE_CASE_TEACHERS } from '../../landing.strings'
import { resolveAssetUrl, LANDING_VIDEOS } from '../../config'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import { TeacherDashboard } from './TeacherDashboard'

/**
 * UseCaseTeachersParents — "Teachers and parents, finally on the same page"
 * section. Media on the LEFT (reverse layout), teal accent on top of a
 * warm-cream background.
 */
export function UseCaseTeachersParents() {
  const dashboardMode = useDashboardMode()
  return (
    <UseCasePanel
      sectionId={USE_CASE_TEACHERS.id}
      eyebrow={USE_CASE_TEACHERS.eyebrow}
      heading={{
        lead: USE_CASE_TEACHERS.headingLead,
        serif: USE_CASE_TEACHERS.headingSerif,
        serifColor: 'var(--lp-teal-ink)',
        tail: USE_CASE_TEACHERS.headingTail,
      }}
      lede={USE_CASE_TEACHERS.lede}
      accent="var(--lp-teal)"
      background="var(--lp-bg-warm)"
      features={USE_CASE_TEACHERS.features}
      videoSrc={resolveAssetUrl(LANDING_VIDEOS.taskRouter)}
      videoLength={USE_CASE_TEACHERS.mediaLength}
      reverse
      dashboardFallback={<TeacherDashboard />}
      showMode={dashboardMode ? 'dashboard' : 'video'}
    />
  )
}
