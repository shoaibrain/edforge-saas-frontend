import { LandingRoot } from '../LandingRoot'
import { TokenGallery } from './TokenGallery'
import { PrimitiveGallery } from './PrimitiveGallery'
import { StringsCatalog } from './StringsCatalog'
import { Hero } from '../sections/hero/Hero'
import { UseCaseDistrict } from '../sections/district/UseCaseDistrict'
import { UseCaseTeachersParents } from '../sections/teachers/UseCaseTeachersParents'
import { UseCaseStudents } from '../sections/students/UseCaseStudents'
import { PlatformPillars } from '../sections/pillars/PlatformPillars'
import { SecurityStrip } from '../sections/security/SecurityStrip'
import { FAQ } from '../sections/faq/FAQ'
import { FinalCTA } from '../sections/cta/FinalCTA'
import { Footer } from '../sections/footer/Footer'

/**
 * LandingPreviewPage — always-on dev preview at /_landing-preview.
 *
 * Sections grow in this file sprint by sprint. Render order reflects the
 * planned production composition so dev can scroll through it in one page.
 *
 *   Sprint 2 → Hero (scroll-driven parallax)
 *   Sprint 3 → + UseCaseDistrict
 *   Sprint 4 → + UseCaseTeachersParents, UseCaseStudents
 *   Sprint 5 → + PlatformPillars
 *   Sprint 6 → + Security, Migration, FAQ, FinalCTA, Footer
 *
 * TokenGallery / PrimitiveGallery / StringsCatalog stay at the bottom as
 * developer-facing documentation.
 */
export function LandingPreviewPage() {
  return (
    <LandingRoot>
      <Hero />
      <UseCaseDistrict />
      <UseCaseTeachersParents />
      <UseCaseStudents />
      <PlatformPillars />
      <SecurityStrip />
      <FAQ />
      <FinalCTA />
      <Footer />

      {/* Developer documentation below the production-shaped flow */}
      <TokenGallery />
      <PrimitiveGallery />
      <StringsCatalog />
    </LandingRoot>
  )
}

export default LandingPreviewPage
