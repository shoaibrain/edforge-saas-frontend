/**
 * ClassroomCard
 *
 * Compact card for a single class section with a slim color stripe,
 * typography-driven hierarchy, and a progress bar for enrollment.
 */

import { useState } from 'react'
import { MoreHorizontal, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { getCapacityPercent } from '../../schemas/section.form'
import { getColorForSubjectArea } from '../../lib/classroom-colors'
import { getCoverForSubjectArea } from '../../lib/classroom-covers'
import { getSubjectIcon, getCapacityColorV2 } from '../../utils/subject-icon'

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
  const capacityColor = getCapacityColorV2(section.currentEnrollment, section.maxEnrollment)
  const SubjectIcon = getSubjectIcon(subjectArea)

  const sectionName = section.sectionName || `${section.courseName || section.courseCode || 'Section'} - ${section.sectionNumber}`
  const courseName = section.courseName || section.courseCode || ''
  const teacherName = section.primaryTeacherName || 'No teacher assigned'

  return (
    <article
      className="group relative rounded-xl border overflow-hidden hover:-translate-y-px transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#378ADD] focus-visible:ring-offset-2"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--v2-border-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--v2-border-default)' }}
      aria-label={`${sectionName} — ${courseName || 'No course'}, ${teacherName}, ${section.currentEnrollment} of ${section.maxEnrollment} students`}
      role="link"
      tabIndex={0}
      onClick={() => onNavigate(section.sectionId)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(section.sectionId) } }}
    >
      {/* Subject-area banner */}
      <div className="h-24 relative overflow-hidden">
        <img src={cover.src} alt={cover.alt} className="w-full h-full object-cover" loading="lazy" />
        <div className={`absolute inset-0 bg-gradient-to-t from-[rgb(var(--background-overlay)/0.20)] to-transparent`} />
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color.gradient}`} />
        {/* Subject icon overlay */}
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-[6px] flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <SubjectIcon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.65)' }} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Title + actions row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 overflow-hidden">
            <h3 className="text-sm font-medium truncate" style={{ color: 'var(--v2-text-primary)' }} title={sectionName}>{sectionName}</h3>
            {courseName && (
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--v2-text-hint)' }} title={courseName}>{courseName}</p>
            )}
          </div>

          {/* Actions menu (three-dot) */}
          {(onEdit || onToggleActive) && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Card actions"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} aria-hidden="true" />
                  <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1" role="menu" aria-label="Section actions">
                    {onEdit && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(section.sectionId) }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        Edit
                      </button>
                    )}
                    {onToggleActive && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onToggleActive(section) }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      >
                        {section.isActive ? <><ToggleLeft className="w-3.5 h-3.5" aria-hidden="true" />Deactivate</> : <><ToggleRight className="w-3.5 h-3.5" aria-hidden="true" />Activate</>}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Teacher */}
        <p className="text-xs truncate" style={{ color: 'var(--v2-text-muted)' }} title={teacherName}>{teacherName}</p>

        {/* Enrollment progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--v2-text-muted)' }}>
              {section.currentEnrollment}/{section.maxEnrollment} students
            </span>
            {/* Status dot + text */}
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: section.isActive ? '#1D9E75' : 'var(--v2-text-ghost)' }}
              />
              <span style={{ color: section.isActive ? 'var(--v2-brand-primary)' : 'var(--v2-text-hint)' }}>
                {section.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="h-1 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-sm"
              style={{
                width: `${percent}%`,
                background: capacityColor,
                transition: 'width 600ms ease-out',
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
