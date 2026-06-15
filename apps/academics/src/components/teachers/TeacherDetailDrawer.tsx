/**
 * TeacherDetailDrawer Component
 *
 * Slide-over drawer showing teacher profile and assigned sections.
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Mail,
  Phone,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
} from 'lucide-react'
import { useSections, flattenSectionPages } from '../../hooks'
import { useEscapeToClose } from '../../hooks/useEscapeToClose'
import { useActiveSchoolId } from '../../stores/app.store'

// ============================================================================
// TYPES
// ============================================================================

interface StaffMember {
  staffId?: string
  userId?: string
  firstName: string
  lastSurname?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  employmentStatus?: string
  status?: string
  hireDate?: string
}

interface TeacherDetailDrawerProps {
  member: StaffMember | null
  onClose: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TeacherDetailDrawer({ member, onClose }: TeacherDetailDrawerProps) {
  const schoolId = useActiveSchoolId() || ''
  const teacherId = member?.staffId || member?.userId || ''
  useEscapeToClose(onClose, !!member)

  // Fetch teacher's sections
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({
    schoolId,
    filters: { teacherId, isActive: true },
    enabled: !!teacherId && !!schoolId && !!member,
  })

  const sections = useMemo(() => flattenSectionPages(sectionsData), [sectionsData])

  const fullName = member
    ? `${member.firstName} ${member.lastSurname || member.lastName || ''}`
    : ''

  return (
    <AnimatePresence>
      {member && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[rgb(var(--background-overlay)/0.30)]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-surface-primary border-l border-border-secondary shadow-xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-profile-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
              <h3 id="staff-profile-title" className="text-lg font-semibold text-text-primary">Staff Profile</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.20)] to-[rgb(var(--state-info-bg)/0.14)] flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-[rgb(var(--state-info-fg))]" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-text-primary">{fullName}</h4>
                  <p className="text-sm text-text-secondary capitalize">
                    {member.role?.replace(/_/g, ' ') || 'Staff'}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Contact Information
                </h5>
                {member.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-primary">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-primary">{member.phone}</span>
                  </div>
                )}
                {member.hireDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <span className="text-text-primary">
                      Hired {new Date(member.hireDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Assigned Sections
                  </h5>
                  <span className="text-xs text-text-tertiary">
                    {sections.length} section{sections.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {sectionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 bg-surface-secondary rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : sections.length === 0 ? (
                  <div className="py-6 text-center">
                    <BookOpen className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                    <p className="text-sm text-text-secondary">No sections assigned</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <div
                        key={section.sectionId}
                        className="p-3 bg-surface-secondary rounded-lg border border-border-secondary"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {section.courseName || section.courseCode || 'Section'}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              Section {section.sectionNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                            <Users className="w-3.5 h-3.5" />
                            {section.currentEnrollment}/{section.maxEnrollment}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
