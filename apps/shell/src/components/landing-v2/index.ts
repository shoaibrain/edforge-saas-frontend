export { LandingRoot } from './LandingRoot'
export { LandingPreviewPage } from './preview/LandingPreviewPage'
export { resolveAssetUrl, LANDING_VIDEOS } from './config'

// Primitives
export { EdforgeLogo } from './components/Brand'
export { Icon, type IconName } from './components/Icon'
export { LandingButton } from './components/LandingButton'
export { Container } from './components/layout/Container'
export { Eyebrow } from './components/layout/Eyebrow'
export { Hairline } from './components/layout/Hairline'

// Hooks
export { useScrollY } from './hooks/useScrollY'
export { useReducedMotion } from './hooks/useReducedMotion'
export { useReducedData } from './hooks/useReducedData'
export { useDashboardMode } from './hooks/useDashboardMode'

// Shared section primitives
export { DemoVideo, type DemoVideoProps, type DemoVideoHandle, type DemoVideoChapter } from './components/DemoVideo'
export { UseCasePanel, type UseCasePanelProps, type UseCasePanelHeading } from './components/UseCasePanel'

// Sections
export { Hero } from './sections/hero/Hero'
export { UseCaseDistrict } from './sections/district/UseCaseDistrict'
export { DistrictDashboard } from './sections/district/DistrictDashboard'
export { UseCaseTeachersParents } from './sections/teachers/UseCaseTeachersParents'
export { TeacherDashboard } from './sections/teachers/TeacherDashboard'
export { UseCaseStudents } from './sections/students/UseCaseStudents'
export { StudentDashboard } from './sections/students/StudentDashboard'
export { PlatformPillars } from './sections/pillars/PlatformPillars'
export { PillarCard, type PillarCardPalette } from './sections/pillars/PillarCard'
export { SecurityStrip } from './sections/security/SecurityStrip'
export { FAQ } from './sections/faq/FAQ'
export { FinalCTA } from './sections/cta/FinalCTA'
export { Footer } from './sections/footer/Footer'
export { SectionErrorBoundary } from './components/SectionErrorBoundary'
export { LandingPageV2 } from './LandingPageV2'
