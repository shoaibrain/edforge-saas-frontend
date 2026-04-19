import { UseCasePanel } from '../../components/UseCasePanel'
import { USE_CASE_DISTRICT } from '../../landing.strings'
import { resolveAssetUrl, LANDING_VIDEOS } from '../../config'
import { useDashboardMode } from '../../hooks/useDashboardMode'
import { DistrictDashboard } from './DistrictDashboard'

/**
 * UseCaseDistrict — "Run your district from one calm dashboard" section.
 * Feature rail left, video right (crimson accent, primary brand color).
 */
export function UseCaseDistrict() {
  const dashboardMode = useDashboardMode()
  return (
    <UseCasePanel
      sectionId={USE_CASE_DISTRICT.id}
      eyebrow={USE_CASE_DISTRICT.eyebrow}
      heading={{
        lead: USE_CASE_DISTRICT.headingLead,
        serif: USE_CASE_DISTRICT.headingSerif,
        serifColor: 'var(--lp-primary)',
        tail: USE_CASE_DISTRICT.headingTail,
      }}
      lede={USE_CASE_DISTRICT.lede}
      accent="var(--lp-primary)"
      features={USE_CASE_DISTRICT.features}
      videoSrc={resolveAssetUrl(LANDING_VIDEOS.taskRouter)}
      videoLength={USE_CASE_DISTRICT.mediaLength}
      dashboardFallback={<DistrictDashboard />}
      showMode={dashboardMode ? 'dashboard' : 'video'}
    />
  )
}
