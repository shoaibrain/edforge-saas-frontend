/**
 * ProfileHeader Component
 *
 * Compact profile header aligned with the Staff Detail page pattern.
 * - DiceBear avatar with rounded-xl shape and status indicator dot
 * - Name, metadata row with dot dividers
 * - Three-dot dropdown for Edit action (no standalone buttons)
 */

import { useState } from 'react'
import { Pencil, MoreHorizontal, FileText, GraduationCap } from 'lucide-react'
import { Button, Avatar } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'
import { getStudentAvatar } from '../../../lib/avatar'

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileHeaderProps {
  student: StudentProfileResponseDto
  onEdit?: () => void
  onEnroll?: () => void
  canEdit?: boolean
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  active: {
    bg: 'bg-[rgb(var(--state-success-bg)/0.18)]',
    text: 'text-[rgb(var(--state-success-fg))]',
    dot: 'bg-[rgb(var(--state-success-fg))]',
  },
  inactive: {
    bg: 'bg-[rgb(var(--background-tertiary)/0.1)]',
    text: 'text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]',
    dot: 'bg-[rgb(var(--text-tertiary))]',
  },
  graduated: {
    bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    text: 'text-[rgb(var(--state-info-fg))]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
  },
  transferred: {
    bg: 'bg-[rgb(var(--state-warning-fg))]/10',
    text: 'text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
  withdrawn: {
    bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]',
    text: 'text-[rgb(var(--state-danger-fg))]',
    dot: 'bg-[rgb(var(--state-danger-fg))]',
  },
  suspended: {
    bg: 'bg-[rgb(var(--state-warning-fg))]/10',
    text: 'text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
}

function getStatusStyle(status: string) {
  return statusStyles[status] || statusStyles.inactive
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({
  onEdit,
  onEnroll,
  canEdit,
}: {
  onEdit?: () => void
  onEnroll?: () => void
  canEdit?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('academics')

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.actions')}
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute ef-inset-inline-end-0 z-20 mt-1 w-48 rounded-lg bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] shadow-lg py-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); onEdit?.() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
              >
                <Pencil className="w-4 h-4" />
                {t('actions.editStudent')}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); onEnroll?.() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                {t('actions.schoolEnrollment')}
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
  const { t } = useTranslation('academics')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProfileHeader({
  student,
  onEdit,
  onEnroll,
  canEdit = true,
}: ProfileHeaderProps) {
  const statusStyle = getStatusStyle(student.status)
  const avatarUrl = getStudentAvatar(student.fullName)
  const { t } = useTranslation('academics')

  return (
    <div className="flex items-start gap-5 pb-2">
      {/* Avatar with status dot */}
      <div className="relative flex-shrink-0">
        <Avatar
          size="xl"
          name={student.fullName}
          src={avatarUrl}
          shape="circle"
          className="w-16 h-16 ring-4 ring-[rgb(var(--border-inverse))] dark:ring-[rgb(var(--background-primary))] shadow-sm bg-[rgb(var(--background-secondary))]"
        />
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[rgb(var(--border-inverse))] dark:border-[rgb(var(--background-primary))] ${statusStyle.dot}`}
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
            <span className="font-medium text-[rgb(var(--action-secondary-fg))]">
              {t('gradeLabel', { level: student.currentGradeLevel })}
            </span>
          )}
          <span className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]" />
          <StatusBadge status={student.status} />
        </div>
      </div>

      {/* Actions dropdown */}
      <div className="flex-shrink-0 self-start">
        <ActionsDropdown onEdit={onEdit} onEnroll={onEnroll} canEdit={canEdit} />
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
      <div className="w-16 h-16 rounded-xl bg-[rgb(var(--background-tertiary))] animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-7 w-56 bg-[rgb(var(--background-tertiary))] rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 bg-[rgb(var(--background-tertiary))] rounded animate-pulse" />
          <div className="h-4 w-20 bg-[rgb(var(--background-tertiary))] rounded animate-pulse" />
          <div className="h-5 w-16 bg-[rgb(var(--background-tertiary))] rounded-full animate-pulse" />
        </div>
      </div>
      <div className="h-10 w-10 bg-[rgb(var(--background-tertiary))] rounded-lg animate-pulse" />
    </div>
  )
}
