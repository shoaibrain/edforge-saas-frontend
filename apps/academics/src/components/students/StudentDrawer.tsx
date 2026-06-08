/**
 * StudentDrawer Component
 *
 * Quick-info slide-over drawer for student records:
 * - Student name as drawer title with avatar, number, and status in header
 * - Three-dot dropdown: View Full Profile, Edit, Export
 * - Demographics, contact, academic summary in card sections
 * - "View Details" CTA at bottom
 *
 * Follows the same pattern as CourseDrawer.tsx and SectionDrawer.tsx.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  MoreVertical,
  Eye,
  Pencil,
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  MapPin,
  Globe,
  Clock,
  ArrowRight,
  BookOpen,
  UserMinus,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { StudentStatusBadge } from './StudentStatusBadge'

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function getAvatarUrl(seed: string, size = 128): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function calculateAge(dateOfBirth: string | undefined): string {
  if (!dateOfBirth) return '—'
  try {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return `${age} yrs`
  } catch {
    return '—'
  }
}

function formatGender(gender: string | undefined): string {
  if (!gender) return '—'
  return gender.charAt(0).toUpperCase() + gender.slice(1).replace(/_/g, ' ')
}

// ============================================================================
// TYPES
// ============================================================================

interface StudentDrawerProps {
  open: boolean
  onClose: () => void
  student: StudentResponseDto | null
  onWithdraw?: (student: StudentResponseDto) => void
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({
  student,
  onClose,
  onWithdraw,
}: {
  student: StudentResponseDto
  onClose: () => void
  onWithdraw?: (student: StudentResponseDto) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-surface-primary border border-border-primary shadow-xl py-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onClose()
                navigate({ to: `/students/${student.studentId}` })
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Full Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                toast.info('Edit functionality coming soon')
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Student
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                toast.info('Export functionality coming soon')
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {student.status === 'active' && onWithdraw && (
              <>
                <div className="border-t border-border-secondary mx-3 my-1.5" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    onWithdraw(student)
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Withdraw Student
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// SECTION CARD — visual container for each content section
// ============================================================================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border-secondary bg-surface-secondary/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-secondary bg-surface-secondary/80">
        <Icon className="w-3.5 h-3.5 text-text-tertiary" />
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  )
}

// ============================================================================
// DETAIL FIELD — label/value pair (mirrors CourseDrawer DetailField)
// ============================================================================

function DetailField({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: React.ReactNode
  icon?: typeof User
  accent?: string
}) {
  return (
    <div className="py-1">
      <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {Icon && <Icon className={`w-3 h-3 ${accent ?? 'text-text-tertiary'}`} />}
        {label}
      </dt>
      <dd className="text-sm font-medium text-text-primary">
        {value || <span className="text-text-tertiary">—</span>}
      </dd>
    </div>
  )
}

// ============================================================================
// STUDENT DRAWER
// ============================================================================

export function StudentDrawer({
  open,
  onClose,
  student,
  onWithdraw,
}: StudentDrawerProps) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Navigate to Student Profile with race-condition-safe timing
  const handleViewDetails = () => {
    if (!student) return
    const target = `/students/${student.studentId}`
    onClose()
    queueMicrotask(() => navigate({ to: target }))
  }

  const addressStr = student?.contactInfo?.address
    ? [
        student.contactInfo.address.street1,
        student.contactInfo.address.street2,
        student.contactInfo.address.city,
        student.contactInfo.address.state,
        student.contactInfo.address.zipCode,
      ]
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <AnimatePresence>
      {open && student && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="student-drawer-title">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.30)] backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-2xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header — student identity */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar (48px compromise per Amendment 15) */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-surface-tertiary shadow-sm ring-1 ring-white/10">
                      <img
                        src={getAvatarUrl(student.studentId, 64)}
                        alt={getInitials(student.firstName, student.lastName)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="student-drawer-title"
                        className="text-lg font-semibold text-text-primary truncate"
                      >
                        {student.fullName}
                        {student.preferredName && (
                          <span className="text-sm font-normal text-text-tertiary ml-1.5">
                            &ldquo;{student.preferredName}&rdquo;
                          </span>
                        )}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        {student.studentNumber && (
                          <span className="font-mono text-xs text-text-tertiary">
                            #{student.studentNumber}
                          </span>
                        )}
                        <StudentStatusBadge status={student.status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ActionsDropdown
                      student={student}
                      onClose={onClose}
                      onWithdraw={onWithdraw}
                    />
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Section cards */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-surface-primary border border-border-secondary text-center">
                        <GraduationCap className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-text-primary">
                          {student.currentGradeLevel || '—'}
                        </p>
                        <p className="text-xs text-text-tertiary">Grade</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-primary border border-border-secondary text-center">
                        <BookOpen className="w-4 h-4 text-[rgb(var(--state-success-fg))] mx-auto mb-1" />
                        <p className="text-lg font-bold text-text-primary">
                          &mdash;
                        </p>
                        <p className="text-xs text-text-tertiary">GPA</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-primary border border-border-secondary text-center">
                        <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-text-primary">
                          &mdash;
                        </p>
                        <p className="text-xs text-text-tertiary">Attendance</p>
                      </div>
                    </div>

                    {/* Demographics */}
                    <SectionCard icon={User} title="Demographics">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <DetailField
                          icon={Calendar}
                          label="Date of Birth"
                          value={
                            student.dateOfBirth
                              ? `${formatDate(student.dateOfBirth)} (${calculateAge(student.dateOfBirth)})`
                              : undefined
                          }
                        />
                        <DetailField
                          icon={User}
                          label="Gender"
                          value={formatGender(student.gender)}
                        />
                        <DetailField
                          icon={GraduationCap}
                          label="Grade Level"
                          accent="text-indigo-500"
                          value={student.currentGradeLevel}
                        />
                        <DetailField
                          icon={Calendar}
                          label="Enrollment Date"
                          value={formatDate(student.enrollmentDate)}
                        />
                        {student.ethnicity && (
                          <DetailField
                            icon={Globe}
                            label="Ethnicity"
                            value={student.ethnicity}
                          />
                        )}
                        {student.primaryLanguage && (
                          <DetailField
                            icon={Globe}
                            label="Primary Language"
                            value={student.primaryLanguage}
                          />
                        )}
                      </div>
                    </SectionCard>

                    {/* Contact Information */}
                    <SectionCard icon={Mail} title="Contact Information">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <DetailField
                          icon={Mail}
                          label="Email"
                          accent="text-[rgb(var(--state-info-fg))]"
                          value={student.contactInfo?.email}
                        />
                        <DetailField
                          icon={Phone}
                          label="Phone"
                          accent="text-green-500"
                          value={student.contactInfo?.phone}
                        />
                      </div>
                      {addressStr && (
                        <div className="mt-3 pt-3 border-t border-border-secondary">
                          <DetailField
                            icon={MapPin}
                            label="Address"
                            value={addressStr}
                          />
                        </div>
                      )}
                    </SectionCard>

                    {/* Guardians */}
                    {student.guardians && student.guardians.length > 0 && (
                      <SectionCard icon={User} title="Guardians">
                        <div className="space-y-3">
                          {student.guardians.map((guardian, i) => (
                            <div
                              key={guardian.guardianId ?? i}
                              className="p-4 bg-surface-primary rounded-xl border border-border-secondary"
                            >
                              <div className="flex items-center justify-between mb-2.5">
                                <p className="text-sm font-semibold text-text-primary">
                                  {guardian.firstName} {guardian.lastName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-surface-tertiary text-text-secondary capitalize">
                                    {guardian.relationship}
                                  </span>
                                  {guardian.isPrimary && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))]">
                                      Primary
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-xs text-text-secondary">
                                {guardian.email && (
                                  <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-text-tertiary" />
                                    {guardian.email}
                                  </span>
                                )}
                                {guardian.phone && (
                                  <span className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-text-tertiary" />
                                    {guardian.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* Special Programs */}
                    {student.specialPrograms &&
                      student.specialPrograms.length > 0 && (
                        <SectionCard icon={GraduationCap} title="Programs & Accommodations">
                          <div className="flex flex-wrap gap-2">
                            {student.specialPrograms.map((program, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] border border-purple-500/10"
                              >
                                {program}
                              </span>
                            ))}
                            {student.accommodations?.map((acc, i) => (
                              <span
                                key={`acc-${i}`}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(var(--state-warning-fg))]/10 text-[rgb(var(--state-warning-fg))] border border-amber-500/10"
                              >
                                {acc}
                              </span>
                            ))}
                          </div>
                        </SectionCard>
                      )}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="shrink-0 px-6 py-4 border-t border-border-secondary bg-surface-secondary/30">
                  <button
                    type="button"
                    onClick={handleViewDetails}
                    aria-label={`View details for ${student.fullName}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-[rgb(var(--action-primary-fg))] rounded-xl font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/50"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
