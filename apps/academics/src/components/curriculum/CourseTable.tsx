/**
 * CourseTable Component
 *
 * Displays a paginated table of courses with sorting, row actions,
 * subject area badges, grade level chips, and status indicators.
 * Uses the TanstackDataTable with ColumnDef-based column definitions.
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
import { TanstackDataTable, createActionsColumn, StatusBadge, type ColumnDef } from '@edforge/ui'
import type { CourseResponseDto } from '@aibrains/shared-types'
import { getDurationLabel, sortGradeCodes } from '../../schemas/course.form'
import { formatCourseType } from '../../utils/course-type'
import { CourseTypeChip } from './CourseTypeChip'
import { SubjectChip } from './SubjectChip'

// ============================================================================
// TYPES
// ============================================================================

interface CourseTableProps {
  courses: CourseResponseDto[]
  isLoading?: boolean
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
  onEdit?: () => void
  onToggleActive?: () => void
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
            {onEdit && (
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
            )}
            {onToggleActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  onToggleActive()
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  course.isActive
                    ? 'text-[rgb(var(--state-warning-fg))] hover:bg-amber-50 dark:hover:bg-[rgb(var(--state-warning-fg))]/10'
                    : 'text-[rgb(var(--state-success-fg))] hover:bg-[rgb(var(--state-success-bg)/0.18)] dark:hover:bg-[rgb(var(--state-success-bg)/0.18)]'
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
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function GradeLevelChips({ grades }: { grades: string[] }) {
  if (!grades || grades.length === 0) return <span className="text-text-tertiary">—</span>

  const sorted = sortGradeCodes(grades)
  const showAll = sorted.length <= 4
  const display = showAll ? sorted : sorted.slice(0, 3)
  const remaining = sorted.length - 3

  return (
    <div className="flex gap-0.5 flex-wrap">
      {display.map((g, i) => (
        <span
          key={i}
          className="text-3xs font-medium py-px px-1.5 rounded-[5px] text-[rgb(var(--text-secondary))] bg-[rgb(var(--background-tertiary))]"
        >
          {g}
        </span>
      ))}
      {!showAll && remaining > 0 && (
        <span className="text-3xs font-medium py-px px-1.5 rounded-[5px] text-[rgb(var(--text-disabled))] bg-[rgb(var(--background-tertiary)/0.5)]">
          +{remaining} more
        </span>
      )}
    </div>
  )
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge tone={isActive ? 'success' : 'neutral'} size="sm" dot>
      {isActive ? 'Active' : 'Inactive'}
    </StatusBadge>
  )
}

// ============================================================================
// COURSE TABLE
// ============================================================================

export function CourseTable({
  courses,
  isLoading = false,
  onAddCourse,
  onViewCourse,
  onEditCourse,
  onToggleActive,
  onNavigateToCourse,
}: CourseTableProps) {
  const columns: ColumnDef<CourseResponseDto, unknown>[] = useMemo(
    () => [
      {

        accessorKey: 'courseCode',
        header: 'Code',
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-3xs font-medium py-0.5 px-1.5 rounded-[5px] tracking-[0.3px] whitespace-nowrap bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]">
            {row.original.courseCode}
          </span>
        ),
      },
      {
        accessorKey: 'courseName',
        header: 'Course Name',
        size: 240,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">
              {row.original.courseName}
            </p>
            {row.original.departmentName && (
              <p className="text-xs text-text-tertiary truncate">
                {row.original.departmentName}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'subjectArea',
        header: 'Subject',
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <SubjectChip subject={row.original.subjectArea} />
            {!row.original.academicSubject && (
              <span
                title="No granular academic subject set. Report cards fall back to this subject area — add a granular subject for finer labels."
                aria-label="No granular academic subject set"
                className="cursor-help text-xs text-amber-500"
              >
                ⚠
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'gradeLevels',
        header: 'Grades',
        size: 140,
        enableSorting: false,
        cell: ({ row }) => <GradeLevelChips grades={row.original.gradeLevels} />,
      },
      {
        accessorKey: 'credits',
        header: 'Credits',
        size: 100,
        cell: ({ row }) => {
          const { style } = formatCourseType(row.original.courseType)
          return (
            <div className="text-right">
              <span className="font-medium text-text-primary">
                {row.original.credits}
              </span>
              {style === 'ap' && (
                <sup className="text-4xs font-bold ml-[3px] text-[rgb(var(--accent-finance-text))]">AP</sup>
              )}
              {style === 'dual' && (
                <sup className="text-4xs font-bold ml-[3px] text-[rgb(var(--accent-academics-text))]">DE</sup>
              )}
              {style === 'honors' && (
                <sup className="text-4xs font-bold ml-[3px] text-[rgb(var(--accent-attendance-text))]">H</sup>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'courseType',
        header: 'Type',
        size: 110,
        cell: ({ row }) => <CourseTypeChip type={row.original.courseType} />,
      },
      {
        accessorKey: 'typicalDuration',
        header: 'Duration',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {getDurationLabel(row.original.typicalDuration)}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 90,
        cell: ({ row }) => <StatusDot isActive={row.original.isActive} />,
      },
      createActionsColumn<CourseResponseDto>({
        cell: ({ row }) => (
          <RowActions
            course={row.original}
            onView={() => onViewCourse?.(row.original)}
            onEdit={() => onEditCourse?.(row.original)}
            onToggleActive={() => onToggleActive?.(row.original)}
            onNavigate={onNavigateToCourse ? () => onNavigateToCourse(row.original) : undefined}
          />
        ),
      }),
    ],
    [onViewCourse, onEditCourse, onToggleActive, onNavigateToCourse]
  )

  return (
    <TanstackDataTable
      columns={columns}
      data={courses}
      getRowId={(course) => course.courseId}
      isLoading={isLoading}
      emptyState={{
        icon: <BookOpen className="w-12 h-12" />,
        title: 'No courses found',
        description:
          'Get started by adding your first course to the catalog.',
        action: onAddCourse
          ? { label: 'Add Course', onClick: onAddCourse }
          : undefined,
      }}
      pagination={{ pageSize: 20 }}
      enableSorting={true}
      onRowClick={onViewCourse}
      maxHeight="calc(100vh - 24rem)"
    />
  )
}
