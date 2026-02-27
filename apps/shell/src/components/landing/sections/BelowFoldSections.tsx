import { DistrictLeadersSection } from './DistrictLeadersSection'
import { TeacherParentSection } from './TeacherParentSection'
import { MidPageCTA } from './MidPageCTA'
import { StudentSection } from './StudentSection'
import { SectionTransition } from './SectionTransition'

export default function BelowFoldSections() {
  return (
    <>
      <DistrictLeadersSection />
      <SectionTransition from="#0a1a24" to="#0c1f2a" />
      <TeacherParentSection />
      <SectionTransition from="#0c1f2a" to="#0a1a24" />
      <StudentSection />
      <SectionTransition from="#0a1a24" to="#0a1a24" />
      <MidPageCTA />
    </>
  )
}
