/**
 * StudentQuickProfile — V2 Quick-info drawer for student records
 *
 * Content-pane-scoped drawer that NEVER overlaps the shell topbar or sidebar.
 * Uses QuickDrawer from @edforge/ui with position: absolute rendering.
 *
 * Visual design matches the V2 prototype:
 * - Gradient avatar with initials
 * - Stat tiles with AttendanceDonutRing
 * - At-risk banner (conditional)
 * - Demographics, Contact, Guardians, Enrolled Sections
 * - Footer actions: Edit, Export, Withdraw, View Full Profile
 */

import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  X,
  MoreVertical,
  Eye,
  Pencil,
  Download,
  UserMinus,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { QuickDrawer, AttendanceDonutRing } from '@edforge/ui'
import { getStudentGradient, getStudentInitials } from '../../utils/student-gradient'

// ============================================================================
// TYPES
// ============================================================================

export interface StudentQuickProfileProps {
  open: boolean
  onClose: () => void
  student: StudentResponseDto | null
  /** Attendance rate (0–100) from the alertsMap, or undefined if no data */
  attendanceRate?: number
  /** Called when user confirms withdraw action */
  onWithdraw?: (student: StudentResponseDto) => void
  /** List of enrolled section names (from sections API) */
  enrolledSections?: string[]
}

// ============================================================================
// HELPERS
// ============================================================================

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
  if (!dateOfBirth) return ''
  try {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return `${age} years old`
  } catch {
    return ''
  }
}

function formatGender(gender: string | undefined): string {
  if (!gender) return '—'
  return gender.charAt(0).toUpperCase() + gender.slice(1).replace(/_/g, ' ')
}

function buildAddressString(contactInfo: StudentResponseDto['contactInfo'] | undefined): string | null {
  if (!contactInfo?.address) return null
  return [
    contactInfo.address.street1,
    contactInfo.address.street2,
    contactInfo.address.city,
    contactInfo.address.state,
    contactInfo.address.zipCode,
  ]
    .filter(Boolean)
    .join(', ') || null
}

// ============================================================================
// SECTION HEADER — compact V2 style
// ============================================================================

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-[5px] mb-[10px]">
      <span className="flex-shrink-0" style={{ color: 'var(--v2-text-faint)' }}>
        {icon}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.6px]"
        style={{ color: 'var(--v2-text-ghost)' }}
      >
        {label}
      </span>
    </div>
  )
}

// ============================================================================
// FIELD ITEM — label + value pair in the V2 compact style
// ============================================================================

function FieldItem({
  icon,
  label,
  value,
  subValue,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  subValue?: string
}) {
  const isEmpty = !value || value === '—'
  return (
    <div className="flex flex-col gap-[3px]">
      <div
        className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.4px]"
        style={{ color: 'var(--v2-text-ghost)' }}
      >
        {icon && (
          <span className="opacity-50" style={{ color: 'currentColor' }}>
            {icon}
          </span>
        )}
        {label}
      </div>
      <div
        className="text-[12px] font-medium"
        style={{ color: isEmpty ? 'var(--v2-text-faint)' : 'var(--v2-text-secondary)' }}
      >
        {value || '—'}
      </div>
      {subValue && (
        <div className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
          {subValue}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ACTIONS DROPDOWN — three-dot menu
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation() // Prevent drawer from closing
      setIsOpen(false)
    }
  }, [])

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center transition-colors hover:opacity-80"
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: 'var(--v2-surface-interactive)',
          border: '1px solid var(--v2-border-default)',
        }}
        aria-label="More options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="w-[13px] h-[13px]" style={{ color: 'var(--v2-text-hint)' }} />
      </button>

      {isOpen && (
        <>
          {/* Click-outside catcher */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 29 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div
            className="absolute right-0 mt-1 w-48 py-1"
            style={{
              zIndex: 30,
              background: 'var(--v2-bg-elevated)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 9,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <DropdownItem
              icon={<Eye className="w-[14px] h-[14px]" />}
              label="View Full Profile"
              onClick={() => {
                setIsOpen(false)
                onClose()
                queueMicrotask(() => navigate({ to: `/students/${student.studentId}` }))
              }}
            />
            <DropdownItem
              icon={<Pencil className="w-[14px] h-[14px]" />}
              label="Edit Student"
              onClick={() => {
                setIsOpen(false)
                toast.info('Edit functionality coming soon')
              }}
            />
            <DropdownItem
              icon={<Download className="w-[14px] h-[14px]" />}
              label="Export"
              onClick={() => {
                setIsOpen(false)
                toast.info('Export functionality coming soon')
              }}
            />
            {student.status === 'active' && onWithdraw && (
              <>
                <div
                  className="mx-3 my-1"
                  style={{ borderTop: '1px solid var(--v2-border-default)' }}
                />
                <DropdownItem
                  icon={<UserMinus className="w-[14px] h-[14px]" />}
                  label="Withdraw Student"
                  danger
                  onClick={() => {
                    setIsOpen(false)
                    onWithdraw(student)
                  }}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function DropdownItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12px] font-medium transition-colors"
      style={{
        color: danger ? 'var(--v2-danger)' : 'var(--v2-text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? 'var(--v2-danger-bg)'
          : 'var(--v2-surface-interactive-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ============================================================================
// AT-RISK BANNER
// ============================================================================

function AtRiskBanner({ rate }: { rate: number }) {
  return (
    <div
      className="flex items-center gap-[6px] px-[10px] py-[8px] mb-[10px]"
      style={{
        background: 'var(--v2-danger-bg)',
        border: '1px solid var(--v2-danger-border)',
        borderRadius: 7,
      }}
      role="alert"
    >
      <div
        className="w-[6px] h-[6px] rounded-full flex-shrink-0"
        style={{ background: 'var(--v2-danger)' }}
      />
      <div>
        <div className="text-[11px] font-medium" style={{ color: 'var(--v2-danger)' }}>
          At-risk &middot; below 80% attendance
        </div>
        <div className="text-[10px] mt-[1px]" style={{ color: 'var(--v2-text-faint)' }}>
          30-day rate: {rate.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// GUARDIAN CARD
// ============================================================================

function GuardianCard({
  guardian,
}: {
  guardian: NonNullable<StudentResponseDto['guardians']>[number]
}) {
  return (
    <div
      className="p-[10px] mb-[6px] last:mb-0"
      style={{
        background: 'var(--v2-surface-inset)',
        border: '1px solid var(--v2-border-default)',
        borderRadius: 8,
      }}
    >
      <div className="flex items-center justify-between mb-[6px]">
        <span className="text-[12px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
          {guardian.firstName} {guardian.lastName}
        </span>
        <div className="flex gap-1">
          <span
            className="text-[9px] font-medium px-[5px] py-[1px]"
            style={{
              borderRadius: 5,
              background: 'rgba(55,138,221,0.1)',
              color: 'var(--v2-info)',
            }}
          >
            {guardian.relationship ? guardian.relationship.charAt(0).toUpperCase() + guardian.relationship.slice(1) : 'Guardian'}
          </span>
          {guardian.isPrimary && (
            <span
              className="text-[9px] font-medium px-[5px] py-[1px]"
              style={{
                borderRadius: 5,
                background: 'rgba(29,158,117,0.1)',
                color: 'var(--v2-brand-primary)',
              }}
            >
              Primary
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-[3px]">
        {guardian.email && (
          <div className="flex items-center gap-[5px] text-[11px]" style={{ color: 'var(--v2-text-hint)' }}>
            <Mail className="w-[11px] h-[11px] opacity-50" />
            {guardian.email}
          </div>
        )}
        {guardian.phone && (
          <div className="flex items-center gap-[5px] text-[11px]" style={{ color: 'var(--v2-text-hint)' }}>
            <Phone className="w-[11px] h-[11px] opacity-50" />
            {guardian.phone}
          </div>
        )}
        {!guardian.email && !guardian.phone && (
          <div className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
            No contact information
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// INLINE SVG ICONS (V2 micro icons for section headers and field labels)
// ============================================================================

const Icons = {
  demographics: (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1a4 4 0 100 8A4 4 0 008 1z" />
      <path d="M4 14h8v-1a4 4 0 00-8 0v1z" />
    </svg>
  ),
  contact: (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h12v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
      <path d="M2 6h12" />
      <path d="M6 3V1M10 3V1" />
    </svg>
  ),
  guardians: (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 7a3 3 0 110-6 3 3 0 010 6zM1 13s-1 0-1-1 1-3.5 5-3.5M15 13s1 0 1-1-1-3.5-4.5-3.5M10 7a3 3 0 110-6" />
    </svg>
  ),
  sections: (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  ),
  calendar: (
    <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="2" width="10" height="9" rx="1.5" />
      <path d="M4 1v2M8 1v2M1 5h10" />
    </svg>
  ),
  gender: (
    <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="6" cy="5" r="4" />
    </svg>
  ),
  grade: (
    <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M2 11L6 3l4 8H2z" />
    </svg>
  ),
  email: (
    <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 3h8v6H2z" />
      <path d="M2 3l4 4 4-4" />
    </svg>
  ),
  phone: (
    <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M3 2a1 1 0 011-1h1l1 3-1.5 1.5a8 8 0 004 4L10 8l3 1v1a1 1 0 01-1 1A10 10 0 012 3" />
    </svg>
  ),
  address: (
    <svg className="w-[9px] h-[9px]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M6 1C4 1 2 3 2 5c0 3 4 6 4 6s4-3 4-6c0-2-2-4-4-4zm0 3a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  ),
  gradeStatIcon: (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="var(--v2-info, #378ADD)" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M2 13L8 3l6 10H2z" />
    </svg>
  ),
  gpaStatIcon: (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 16 16" fill="none" stroke="var(--v2-accent-purple, #7F77DD)" strokeWidth="1.5">
      <path d="M3 13V7M8 13V3M13 13V9" strokeLinecap="round" />
    </svg>
  ),
} as const

// ============================================================================
// STUDENT QUICK PROFILE — MAIN COMPONENT
// ============================================================================

export function StudentQuickProfile({
  open,
  onClose,
  student,
  attendanceRate,
  onWithdraw,
  enrolledSections,
}: StudentQuickProfileProps) {
  const navigate = useNavigate()

  const handleViewDetails = useCallback(() => {
    if (!student) return
    const target = `/students/${student.studentId}`
    onClose()
    queueMicrotask(() => navigate({ to: target }))
  }, [student, onClose, navigate])

  if (!student) return null

  const addressStr = buildAddressString(student.contactInfo)
  const initials = getStudentInitials(student.firstName, student.lastName)
  const gradient = getStudentGradient(student.fullName)
  const age = calculateAge(student.dateOfBirth)
  const showAtRisk = attendanceRate != null && attendanceRate < 80

  return (
    <QuickDrawer
      isOpen={open}
      onClose={onClose}
      width={360}
      ariaLabelledBy="student-qp-title"
    >
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <QuickDrawer.Header className="px-4 pt-[14px] pb-[12px]">
        {/* Identity row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-[10px] min-w-0">
            {/* Avatar with gradient */}
            <div
              className="flex-shrink-0 flex items-center justify-center text-[16px] font-semibold text-white"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: gradient,
              }}
            >
              {initials}
            </div>

            {/* Name + meta */}
            <div className="min-w-0">
              <h2
                id="student-qp-title"
                className="text-[15px] font-semibold truncate"
                style={{ color: 'var(--v2-text-primary)', letterSpacing: '-0.2px' }}
              >
                {student.fullName}
              </h2>
              <div className="flex items-center gap-[6px] mt-[3px]">
                {student.studentNumber && (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: 'var(--v2-text-faint)' }}
                  >
                    #{student.studentNumber}
                  </span>
                )}
                <span
                  className="text-[10px] font-medium px-[7px] py-[1px]"
                  style={{
                    borderRadius: 8,
                    background: 'rgba(29,158,117,0.12)',
                    color: 'var(--v2-brand-primary)',
                  }}
                >
                  {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-[5px] flex-shrink-0">
            <ActionsDropdown student={student} onClose={onClose} onWithdraw={onWithdraw} />
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center transition-colors hover:opacity-80"
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: 'var(--v2-surface-interactive)',
                border: '1px solid var(--v2-border-default)',
              }}
              aria-label="Close drawer"
            >
              <X className="w-[13px] h-[13px]" style={{ color: 'var(--v2-text-hint)' }} />
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-[7px]">
          {/* Grade */}
          <div
            className="text-center px-2 py-[10px]"
            style={{
              background: 'var(--v2-surface-inset)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 8,
            }}
          >
            <div className="flex justify-center mb-[5px]">{Icons.gradeStatIcon}</div>
            <div
              className="text-[16px] font-semibold leading-none mb-[3px]"
              style={{ color: 'var(--v2-text-primary)' }}
            >
              {student.currentGradeLevel || '—'}
            </div>
            <div
              className="text-[9px] font-medium uppercase tracking-[0.4px]"
              style={{ color: 'var(--v2-text-faint)' }}
            >
              Grade
            </div>
          </div>

          {/* GPA */}
          <div
            className="text-center px-2 py-[10px]"
            style={{
              background: 'var(--v2-surface-inset)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 8,
            }}
          >
            <div className="flex justify-center mb-[5px]">{Icons.gpaStatIcon}</div>
            <div
              className="text-[16px] font-semibold leading-none mb-[3px]"
              style={{ color: 'var(--v2-text-faint)' }}
            >
              —
            </div>
            <div
              className="text-[9px] font-medium uppercase tracking-[0.4px]"
              style={{ color: 'var(--v2-text-faint)' }}
            >
              GPA
            </div>
          </div>

          {/* Attendance */}
          <div
            className="text-center px-2 py-[10px]"
            style={{
              background: 'var(--v2-surface-inset)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 8,
            }}
          >
            <div className="flex justify-center mb-[5px]">
              {attendanceRate != null ? (
                <AttendanceDonutRing rate={attendanceRate} size={28} strokeWidth={3} showLabel />
              ) : (
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ border: '2px solid var(--v2-text-ghost)' }}
                />
              )}
            </div>
            <div
              className="text-[13px] font-semibold leading-none mb-[3px]"
              style={{
                color: attendanceRate != null
                  ? attendanceRate < 80
                    ? 'var(--v2-danger)'
                    : attendanceRate < 90
                      ? 'var(--v2-warning)'
                      : 'var(--v2-brand-primary)'
                  : 'var(--v2-text-faint)',
              }}
            >
              {attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—'}
            </div>
            <div
              className="text-[9px] font-medium uppercase tracking-[0.4px]"
              style={{ color: 'var(--v2-text-faint)' }}
            >
              Attendance
            </div>
          </div>
        </div>
      </QuickDrawer.Header>

      {/* ================================================================ */}
      {/* BODY — scrollable                                                */}
      {/* ================================================================ */}
      <QuickDrawer.Body>
        {/* At-risk banner */}
        {showAtRisk && (
          <div className="px-4 pt-3">
            <AtRiskBanner rate={attendanceRate!} />
          </div>
        )}

        {/* Demographics */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--v2-border-default)' }}>
          <SectionHeader icon={Icons.demographics} label="Demographics" />
          <div className="grid grid-cols-2 gap-2">
            <FieldItem
              icon={Icons.calendar}
              label="Date of birth"
              value={formatDate(student.dateOfBirth)}
              subValue={age || undefined}
            />
            <FieldItem
              icon={Icons.gender}
              label="Gender"
              value={formatGender(student.gender)}
            />
            <FieldItem
              icon={Icons.grade}
              label="Grade level"
              value={student.currentGradeLevel ? `Grade ${student.currentGradeLevel}` : '—'}
            />
            <FieldItem
              icon={Icons.calendar}
              label="Enrolled"
              value={formatDate(student.enrollmentDate)}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--v2-border-default)' }}>
          <SectionHeader icon={Icons.contact} label="Contact information" />
          <div className="grid grid-cols-2 gap-2">
            <FieldItem
              icon={Icons.email}
              label="Email"
              value={student.contactInfo?.email || '—'}
            />
            <FieldItem
              icon={Icons.phone}
              label="Phone"
              value={student.contactInfo?.phone || '—'}
            />
          </div>
          {addressStr && (
            <div className="mt-[6px]">
              <FieldItem
                icon={Icons.address}
                label="Address"
                value={addressStr}
              />
            </div>
          )}
          {!addressStr && !student.contactInfo?.email && !student.contactInfo?.phone && (
            <div className="mt-[6px]">
              <FieldItem icon={Icons.address} label="Address" value="—" />
            </div>
          )}
        </div>

        {/* Guardians */}
        {student.guardians && student.guardians.length > 0 && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--v2-border-default)' }}>
            <SectionHeader icon={Icons.guardians} label="Guardians" />
            {student.guardians.map((guardian, i) => (
              <GuardianCard key={guardian.guardianId ?? i} guardian={guardian} />
            ))}
          </div>
        )}

        {/* Enrolled Sections */}
        {enrolledSections && enrolledSections.length > 0 && (
          <div className="px-4 py-3">
            <SectionHeader icon={Icons.sections} label="Enrolled sections" />
            <div className="flex flex-wrap gap-1">
              {enrolledSections.map((section) => (
                <span
                  key={section}
                  className="text-[10px] font-medium px-2 py-[2px]"
                  style={{
                    borderRadius: 8,
                    background: 'var(--v2-surface-interactive)',
                    border: '1px solid var(--v2-border-hover)',
                    color: 'var(--v2-text-hint)',
                  }}
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        )}
      </QuickDrawer.Body>

      {/* ================================================================ */}
      {/* FOOTER — sticky at bottom                                        */}
      {/* ================================================================ */}
      <QuickDrawer.Footer className="px-4 py-3">
        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-[6px] mb-2">
          <button
            type="button"
            onClick={() => toast.info('Edit functionality coming soon')}
            className="flex items-center justify-center gap-[5px] py-[7px] text-[11px] transition-colors hover:opacity-80"
            style={{
              background: 'var(--v2-surface-interactive)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 7,
              color: 'var(--v2-text-hint)',
            }}
          >
            <Pencil className="w-3 h-3" />
            Edit student
          </button>
          <button
            type="button"
            onClick={() => toast.info('Export functionality coming soon')}
            className="flex items-center justify-center gap-[5px] py-[7px] text-[11px] transition-colors hover:opacity-80"
            style={{
              background: 'var(--v2-surface-interactive)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 7,
              color: 'var(--v2-text-hint)',
            }}
          >
            <Download className="w-3 h-3" />
            Export record
          </button>
        </div>

        {/* Withdraw button */}
        {student.status === 'active' && onWithdraw && (
          <button
            type="button"
            onClick={() => onWithdraw(student)}
            className="flex items-center justify-center gap-[5px] w-full py-[7px] text-[11px] mb-2 transition-colors hover:opacity-80"
            style={{
              background: 'var(--v2-danger-bg)',
              border: '1px solid var(--v2-danger-border)',
              borderRadius: 7,
              color: 'var(--v2-danger)',
            }}
          >
            <UserMinus className="w-3 h-3" />
            Withdraw student
          </button>
        )}

        {/* View full profile — primary CTA */}
        <button
          type="button"
          onClick={handleViewDetails}
          className="flex items-center justify-center gap-[6px] w-full py-[10px] text-[13px] font-medium transition-all hover:opacity-90"
          style={{
            background: 'rgba(29,158,117,0.1)',
            border: '1px solid rgba(29,158,117,0.2)',
            borderRadius: 9,
            color: 'var(--v2-brand-primary)',
          }}
          aria-label={`View full profile for ${student.fullName}`}
        >
          View full profile
          <ArrowRight className="w-[14px] h-[14px]" />
        </button>
      </QuickDrawer.Footer>
    </QuickDrawer>
  )
}
