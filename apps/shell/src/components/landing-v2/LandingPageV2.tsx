import { useEffect } from 'react'
import { LandingRoot } from './LandingRoot'
import { SectionErrorBoundary } from './components/SectionErrorBoundary'
import { useLandingSeo } from './hooks/useLandingSeo'
import { landingEvents } from '../../analytics/landing-events'
import { Navbar } from '../landing/Navbar'
import '../landing/landing.css'
import { Hero } from './sections/hero/Hero'
import { UseCaseDistrict } from './sections/district/UseCaseDistrict'
import { UseCaseTeachersParents } from './sections/teachers/UseCaseTeachersParents'
import { UseCaseStudents } from './sections/students/UseCaseStudents'
import { PlatformPillars } from './sections/pillars/PlatformPillars'
import { SecurityStrip } from './sections/security/SecurityStrip'
import { FAQ } from './sections/faq/FAQ'
import { FinalCTA } from './sections/cta/FinalCTA'
import { Footer } from './sections/footer/Footer'

/**
 * LandingPageV2 — production composition rendered at `/` for
 * unauthenticated visitors.
 *
 * Layout:
 *   <div.landing-page>             — scopes legacy Navbar CSS
 *     <a.skip-link>                — first focusable element
 *     <Navbar />                   — legacy, reused as-is
 *     <LandingRoot>                — sets data-surface="landing", emits <main>
 *       Hero → District → Teachers → Students → Pillars →
 *       Security → FAQ → FinalCTA → Footer
 *     </LandingRoot>
 *   </div>
 *
 * Every landing-v2 section sits behind a SectionErrorBoundary so one
 * broken section does not white-screen the marketing page. Migration
 * strip is intentionally omitted.
 */
export function LandingPageV2() {
  useLandingSeo()
  useEffect(() => {
    landingEvents.pageView()
  }, [])

  return (
    <div className="landing-page">
      <a href="#lp-main" className="lp-skip-link">
        Skip to content
      </a>
      <SectionErrorBoundary sectionName="Navbar">
        <Navbar />
      </SectionErrorBoundary>
      <LandingRoot>
        <SectionErrorBoundary sectionName="Hero">
          <Hero />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="UseCaseDistrict">
          <UseCaseDistrict />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="UseCaseTeachersParents">
          <UseCaseTeachersParents />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="UseCaseStudents">
          <UseCaseStudents />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="PlatformPillars">
          <PlatformPillars />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="SecurityStrip">
          <SecurityStrip />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="FAQ">
          <FAQ />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="FinalCTA">
          <FinalCTA />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Footer">
          <Footer />
        </SectionErrorBoundary>
      </LandingRoot>
    </div>
  )
}

export default LandingPageV2
