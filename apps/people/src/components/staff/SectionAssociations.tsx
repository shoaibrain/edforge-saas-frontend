/**
 * SectionAssociations Component
 *
 * @deprecated Teaching sections are now rendered inline within the
 * AssignmentsTab on the staff detail page (detail.tsx). This standalone
 * component is retained for backward compatibility but is no longer used.
 *
 * Read-only table showing teacher's class/section associations.
 * Cross-service pattern: calls Academics service directly.
 */

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ExternalLink,
  GraduationCap,
} from 'lucide-react'
import { apiGet } from '../../lib/api'

// ============================================================================
// TYPES
// ============================================================================

interface SectionData {
  sectionId: string
  courseName?: string
  courseCode?: string
  sectionIdentifier?: string
  classPeriodName?: string
  roomNumber?: string
  schoolName?: string
  schoolId?: string
  termName?: string
  studentCount?: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TEACHING_ROLES = ['teacher', 'substitute']

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

// ============================================================================
// HOOKS
// ============================================================================

function useSectionsForTeacher(staffId: string | undefined, enabled: boolean) {
  return useQuery<SectionData[]>({
    queryKey: ['sections', 'teacher', staffId],
    queryFn: async () => {
      try {
        const response = await apiGet<{ items: SectionData[] } | SectionData[]>(
          '/academics/sections',
          { teacherId: staffId },
        )
        if (Array.isArray(response)) return response
        return response.items ?? []
      } catch {
        // Gracefully handle if academics endpoint doesn't exist
        return []
      }
    },
    enabled: !!staffId && enabled,
    staleTime: 60_000,
    retry: false,
  })
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SectionAssociations({
  staffId,
  staffRole,
}: {
  staffId: string
  staffRole: string
}) {
  const isTeachingRole = TEACHING_ROLES.includes(staffRole)
  const { data: sections, isLoading, isError } = useSectionsForTeacher(staffId, isTeachingRole)

  // Non-teaching staff message
  if (!isTeachingRole) {
    return (
      <motion.div
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <div className="text-center py-16 bg-[rgb(var(--background-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">Not Applicable</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              Section associations are only available for teaching staff.
            </p>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Group sections by school
  const sectionsBySchool = (sections ?? []).reduce<Record<string, SectionData[]>>((acc, section) => {
    const key = section.schoolName || section.schoolId || 'Unknown School'
    if (!acc[key]) acc[key] = []
    acc[key].push(section)
    return acc
  }, {})

  const totalSections = sections?.length ?? 0
  const totalStudents = sections?.reduce((sum, s) => sum + (s.studentCount ?? 0), 0) ?? 0

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Section Associations</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Classes and sections assigned to this teacher
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-[rgb(var(--background-secondary))] rounded-xl" />
            ))}
          </div>
        ) : isError || !sections || sections.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--background-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Sections Assigned</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              {isError
                ? 'Section data is not yet available. The academics module may not be configured.'
                : 'This teacher is not currently assigned to any class sections.'}
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Total Sections</p>
                <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">{totalSections}</p>
              </div>
              <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Total Students</p>
                <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">{totalStudents}</p>
              </div>
            </div>

            {/* Sections by School */}
            {Object.entries(sectionsBySchool).map(([schoolName, schoolSections]) => (
              <div key={schoolName} className="mb-6">
                <h4 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {schoolName}
                  <span className="text-xs text-[rgb(var(--text-tertiary))] font-normal">
                    ({schoolSections.length} section{schoolSections.length !== 1 ? 's' : ''})
                  </span>
                </h4>

                <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-secondary))]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[rgb(var(--background-tertiary))]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Section</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Term</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Students</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
                      {schoolSections.map((section) => (
                        <tr
                          key={section.sectionId}
                          className="bg-[rgb(var(--background-secondary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                {section.courseName || '—'}
                              </p>
                              {section.courseCode && (
                                <p className="text-xs text-[rgb(var(--text-tertiary))]">{section.courseCode}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                            {section.sectionIdentifier || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                            {section.classPeriodName || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                            {section.roomNumber || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                            {section.termName || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                            {section.studentCount ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`/academics/sections/${section.sectionId}`}
                              className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--action-secondary-fg))] transition-colors inline-block"
                              title="View in Academics"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
