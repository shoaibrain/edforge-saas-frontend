/**
 * CourseTable Component
 *
 * Displays a paginated table of courses with sorting, row actions,
 * subject area badges, grade level chips, and status indicators.
 * Follows the same DataTable pattern as StudentTable.
 */

import { useMemo, useState } from 'react'
import {
  BookOpen,
  MoreVertical,
  Eye,
  ExternalLink,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { DataTable, type Column } from '@edforge/ui'
import type { CourseResponseDto } from '@aibrains/shared-types'
import {
  getSubjectAreaLabel,
  getCourseTypeLabel,
  getCreditTypeLabel,
  getDurationLabel,
  SUBJECT_AREA_COLORS,
  COURSE_TYPE_COLORS,
} from '../../schemas/course.form'

// ============================================================================
// TYPES
// ============================================================================

interface CourseTableProps {
  courses: CourseResponseDto[]
  isLoading?: boolean
  hasMore?: boolean
  isFetchingMore?: boolean
  onLoadMore?: () => void
  onAddCourse?: () => void
  onViewCourse?: (course: CourseResponseDto) => void
  onEditCourse?: (course: CourseResponseDto) => void
  onToggleActive?: (course: CourseResponseDto) => void
  onNavigateToCourse?: (course: CourseResponseDto) => void
}

// ============================================================================
// ROW ACTIONS
// ============================================================================

interface RowActionsProps {
  course: CourseResponseDto
  onView: () => void
  onEdit: () => void
  onToggleActive: () => void
  onNavigate?: () => void
}

function RowActions({ course, onView, onEdit, onToggleActive, onNavigate }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onView()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Eye className="w-4 h-4" />
              Quick View
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  onNavigate()
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Details
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onEdit()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Course
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onToggleActive()
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                course.isActive
                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
              }`}
            >
              {course.isActive ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SubjectBadge({ value }: { value: string }) {
  const colors = SUBJECT_AREA_COLORS[value] ?? SUBJECT_AREA_COLORS.other
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {getSubjectAreaLabel(value)}
    </span>
  )
}

function CourseTypeBadge({ value }: { value: string }) {
  const colors = COURSE_TYPE_COLORS[value] ?? COURSE_TYPE_COLORS.required
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {getCourseTypeLabel(value)}
    </span>
  )
}

function GradeLevelChips({ grades }: { grades: string[] }) {
  if (!grades || grades.length === 0) return <span className="text-text-tertiary">—</span>

  const display = grades.length > 4
    ? [...grades.slice(0, 3), `+${grades.length - 3}`]
    : grades

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {display.map((g, i) => (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-surface-tertiary text-text-secondary"
        >
          {g}
        </span>
      ))}
    </div>
  )
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-2 h-2 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-gray-400'
        }`}
      />
      <span className="text-xs text-text-secondary">
        {isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}

// ============================================================================
// COURSE TABLE
// ============================================================================

export function CourseTable({
  courses,
  isLoading = false,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  onAddCourse,
  onViewCourse,
  onEditCourse,
  onToggleActive,
  onNavigateToCourse,
}: CourseTableProps) {
  const columns: Column<CourseResponseDto>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        header: 'Code',
        sortable: true,
        width: '120px',
        render: (course) => (
          <span className="font-mono text-xs font-semibold text-text-primary bg-surface-tertiary px-2 py-0.5 rounded">
            {course.courseCode}
          </span>
        ),
      },
      {
        key: 'courseName',
        header: 'Course Name',
        sortable: true,
        width: '240px',
        render: (course) => (
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">
              {course.courseName}
            </p>
            {course.departmentName && (
              <p className="text-xs text-text-tertiary truncate">
                {course.departmentName}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'subjectArea',
        header: 'Subject',
        sortable: true,
        width: '160px',
        render: (course) => <SubjectBadge value={course.subjectArea} />,
      },
      {
        key: 'gradeLevels',
        header: 'Grades',
        width: '140px',
        render: (course) => <GradeLevelChips grades={course.gradeLevels} />,
      },
      {
        key: 'credits',
        header: 'Credits',
        sortable: true,
        width: '100px',
        render: (course) => (
          <div className="text-right">
            <span className="font-medium text-text-primary">{course.credits}</span>
            {course.creditType && (
              <span className="ml-1 text-xs text-text-tertiary">
                {getCreditTypeLabel(course.creditType)}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'courseType',
        header: 'Type',
        sortable: true,
        width: '110px',
        render: (course) => <CourseTypeBadge value={course.courseType} />,
      },
      {
        key: 'typicalDuration',
        header: 'Duration',
        width: '100px',
        render: (course) => (
          <span className="text-sm text-text-secondary">
            {getDurationLabel(course.typicalDuration)}
          </span>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        sortable: true,
        width: '90px',
        render: (course) => <StatusDot isActive={course.isActive} />,
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={courses}
      keyExtractor={(course) => course.courseId}
      isLoading={isLoading}
      skeletonRows={8}
      emptyState={{
        icon: <BookOpen className="w-12 h-12" />,
        title: 'No courses found',
        description:
          'Get started by adding your first course to the catalog.',
        action: onAddCourse
          ? { label: 'Add Course', onClick: onAddCourse }
          : undefined,
      }}
      hasMore={hasMore}
      isFetchingMore={isFetchingMore}
      onLoadMore={onLoadMore}
      onRowClick={onViewCourse}
      rowActions={(course) => (
        <RowActions
          course={course}
          onView={() => onViewCourse?.(course)}
          onEdit={() => onEditCourse?.(course)}
          onToggleActive={() => onToggleActive?.(course)}
          onNavigate={onNavigateToCourse ? () => onNavigateToCourse(course) : undefined}
        />
      )}
    />
  )
}
