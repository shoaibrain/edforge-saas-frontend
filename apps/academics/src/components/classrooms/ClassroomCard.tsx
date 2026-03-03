/**
 * ClassroomCard
 *
 * Google Classroom-style card for a single class section.
 * Uses cover image with per-course color overlay for visual differentiation.
 */

import { useState } from 'react'
import { MoreHorizontal, Pencil, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { getCapacityColor, getCapacityPercent } from '../../schemas/section.form'
import { getColorForSubjectArea } from '../../lib/classroom-colors'
import { getCoverForSubjectArea } from '../../lib/classroom-covers'
import { getStaffAvatar } from '../../lib/avatar'

interface ClassroomCardProps {
  section: SectionResponseDto
  /** Fallback subjectArea from parent course (for sections not yet backfilled) */
  subjectAreaOverride?: string
  onNavigate: (sectionId: string) => void
  onEdit?: (sectionId: string) => void
  onToggleActive?: (section: SectionResponseDto) => void
}

export function ClassroomCard({ section, subjectAreaOverride, onNavigate, onEdit, onToggleActive }: ClassroomCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const subjectArea = section.subjectArea ?? subjectAreaOverride
  const color = getColorForSubjectArea(subjectArea)
  const cover = getCoverForSubjectArea(subjectArea)
  const percent = getCapacityPercent(section.currentEnrollment, section.maxEnrollment)
  const barColor = getCapacityColor(section.currentEnrollment, section.maxEnrollment)

  const displayName = section.sectionName || `${section.courseName || section.courseCode || 'Section'} - ${section.sectionNumber}`
  const teacherName = section.primaryTeacherName || 'No teacher assigned'

  return (
    <article
      className="group relative bg-surface-primary rounded-xl border border-border-primary overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      aria-label={displayName}
      onClick={() => onNavigate(section.sectionId)}
    >
      {/* Cover Image Banner with Color Overlay */}
      <div className="h-20 relative overflow-hidden">
        <img
          src={cover.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${color.gradient} opacity-50`} />
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <h3 className="text-white font-semibold text-sm truncate drop-shadow-sm">
            {displayName}
          </h3>
          {section.courseCode && (
            <p className="text-white/80 text-xs truncate drop-shadow-sm">
              {section.courseCode}
            </p>
          )}
        </div>

        {/* Actions menu */}
        {(onEdit || onToggleActive) && (
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Card actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(section.sectionId) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {onToggleActive && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onToggleActive(section) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    >
                      {section.isActive ? <><ToggleLeft className="w-3.5 h-3.5" />Deactivate</> : <><ToggleRight className="w-3.5 h-3.5" />Activate</>}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Instructor */}
        <div className="flex items-center gap-2">
          <img
            src={getStaffAvatar(teacherName)}
            alt={teacherName}
            className="w-7 h-7 rounded-full flex-shrink-0"
          />
          <span className="text-xs text-text-secondary truncate">Instructor: {teacherName}</span>
        </div>

        {/* Enrollment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <Users className="w-3.5 h-3.5" />
              <span>{section.currentEnrollment} / {section.maxEnrollment} students</span>
            </div>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              section.isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400'
            }`}>
              <div className={`w-1 h-1 rounded-full ${section.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {section.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </article>
  )
}
