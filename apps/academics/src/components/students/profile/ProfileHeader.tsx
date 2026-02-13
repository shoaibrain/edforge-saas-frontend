/**
 * ProfileHeader Component
 *
 * Compact profile header aligned with the Staff Detail page pattern.
 * - DiceBear avatar with rounded-xl shape and status indicator dot
 * - Name, metadata row with dot dividers
 * - Three-dot dropdown for Edit action (no standalone buttons)
 */

import { useState } from 'react'
import { Pencil, MoreHorizontal, FileText } from 'lucide-react'
import { Button, Avatar } from '@edforge/ui'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'
import { getStudentAvatar } from '../../../lib/avatar'

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileHeaderProps {
  student: StudentProfileResponseDto
  onEdit?: () => void
  canEdit?: boolean
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-gray-400',
    label: 'Inactive',
  },
  graduated: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    label: 'Graduated',
  },
  transferred: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Transferred',
  },
  withdrawn: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Withdrawn',
  },
  suspended: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-amber-500',
    label: 'Suspended',
  },
}

function getStatusStyle(status: string) {
  return statusStyles[status] || statusStyles.inactive
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({ onEdit, canEdit }: { onEdit?: () => void; canEdit?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-lg py-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); onEdit?.() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Student
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProfileHeader({
  student,
  onEdit,
  canEdit = true,
}: ProfileHeaderProps) {
  const statusStyle = getStatusStyle(student.status)
  const avatarUrl = getStudentAvatar(student.fullName)

  return (
    <div className="flex items-start gap-5 pb-2">
      {/* Avatar with status dot */}
      <div className="relative flex-shrink-0">
        <Avatar
          size="xl"
          name={student.fullName}
          src={avatarUrl}
          shape="rounded"
          className="w-16 h-16 ring-2 ring-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
        />
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[rgb(var(--surface-primary))] ${statusStyle.dot}`}
        />
      </div>

      {/* Name & metadata */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
          {student.fullName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
          {student.studentNumber && (
            <span className="flex items-center gap-1 text-[rgb(var(--text-tertiary))]">
              <FileText className="w-3.5 h-3.5" />
              {student.studentNumber}
            </span>
          )}
          {student.studentNumber && student.currentGradeLevel && (
            <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
          )}
          {student.currentGradeLevel && (
            <span className="font-medium text-teal-600 dark:text-teal-400">
              Grade {student.currentGradeLevel}
            </span>
          )}
          <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
          <StatusBadge status={student.status} />
        </div>
      </div>

      {/* Actions dropdown */}
      <div className="flex-shrink-0 self-start">
        <ActionsDropdown onEdit={onEdit} canEdit={canEdit} />
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-start gap-5 pb-2">
      <div className="w-16 h-16 rounded-xl bg-[rgb(var(--surface-tertiary))] animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-7 w-56 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
          <div className="h-5 w-16 bg-[rgb(var(--surface-tertiary))] rounded-full animate-pulse" />
        </div>
      </div>
      <div className="h-10 w-10 bg-[rgb(var(--surface-tertiary))] rounded-lg animate-pulse" />
    </div>
  )
}
