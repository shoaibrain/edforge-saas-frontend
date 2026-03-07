import { DistrictLeadersSection } from './DistrictLeadersSection'
import { TeacherParentSection } from './TeacherParentSection'
import { MidPageCTA } from './MidPageCTA'
import { StudentSection } from './StudentSection'

export default function BelowFoldSections() {
  return (
    <div className="flex flex-col w-full">
      <div id="district" className="bg-[#FAF9F6]">
        <DistrictLeadersSection />
      </div>

      <div id="teacher" className="bg-white pt-12">
        <TeacherParentSection />
      </div>

      <div id="student" className="bg-[#FAF9F6] pt-12">
        <StudentSection />
      </div>

      <div className="bg-white pt-24">
        <MidPageCTA />
      </div>
    </div>
  )
}
