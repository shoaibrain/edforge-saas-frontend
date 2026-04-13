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
import { TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
import type { CourseResponseDto } from '@aibrains/shared-types'
import { getDurationLabel } from '../../schemas/course.form'
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

  const showAll = grades.length <= 4
  const display = showAll ? grades : grades.slice(0, 3)
  const remaining = grades.length - 3

  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {display.map((g, i) => (
        <span
          key={i}
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--text-secondary, #7a8099)',
            background: 'rgba(255,255,255,0.05)',
            padding: '1px 5px',
            borderRadius: 5,
          }}
        >
          {g}
        </span>
      ))}
      {!showAll && remaining > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--text-hint, #5a6070)',
            background: 'rgba(255,255,255,0.03)',
            padding: '1px 5px',
            borderRadius: 5,
          }}
        >
          +{remaining} more
        </span>
      )}
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
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 500,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-secondary, #9aa0b8)',
              padding: '3px 7px',
              borderRadius: 5,
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
            }}
          >
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
        cell: ({ row }) => <SubjectChip subject={row.original.subjectArea} />,
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
                <sup style={{ color: 'var(--color-danger, #E24B4A)', fontSize: 9, fontWeight: 700, marginLeft: 3 }}>AP</sup>
              )}
              {style === 'dual' && (
                <sup style={{ color: 'var(--color-info, #378ADD)', fontSize: 9, fontWeight: 700, marginLeft: 3 }}>DE</sup>
              )}
              {style === 'honors' && (
                <sup style={{ color: 'var(--color-warning, #EF9F27)', fontSize: 9, fontWeight: 700, marginLeft: 3 }}>H</sup>
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
