/**
 * SectionTable Component
 *
 * Displays a paginated table of class sections with capacity indicators,
 * teacher assignments, and row actions.
 */

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  MoreVertical,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react'
import { TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
import type { SectionResponseDto } from '@aibrains/shared-types'
import {
  getCapacityColor,
  getCapacityPercent,
  getCapacityLabel,
  getCapacityTextColor,
} from '../../schemas/section.form'

// ============================================================================
// TYPES
// ============================================================================

interface SectionTableProps {
  sections: SectionResponseDto[]
  isLoading?: boolean
  onViewSection?: (section: SectionResponseDto) => void
  onEditSection?: (section: SectionResponseDto) => void
  onToggleActive?: (section: SectionResponseDto) => void
  onViewRoster?: (section: SectionResponseDto) => void
}

// ============================================================================
// ROW ACTIONS
// ============================================================================

interface RowActionsProps {
  section: SectionResponseDto
  onView: () => void
  onEdit: () => void
  onToggleActive: () => void
  onViewRoster: () => void
}

function RowActions({ section, onView, onEdit, onToggleActive, onViewRoster }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Section actions"
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
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onViewRoster()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Users className="w-4 h-4" />
              View Roster
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onEdit()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Section
            </button>
            <div className="border-t border-border-secondary my-1" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onToggleActive()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {section.isActive ? (
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
// CAPACITY BAR
// ============================================================================

function CapacityBar({ current, max }: { current: number; max: number }) {
  const percent = getCapacityPercent(current, max)
  const barColor = getCapacityColor(current, max)
  const textColor = getCapacityTextColor(current, max)

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${textColor}`}>
        {getCapacityLabel(current, max)}
      </span>
    </div>
  )
}

// ============================================================================
// SECTION TABLE
// ============================================================================

export function SectionTable({
  sections,
  isLoading,
  onViewSection,
  onEditSection,
  onToggleActive,
  onViewRoster,
}: SectionTableProps) {
  const columns: ColumnDef<SectionResponseDto, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'sectionNumber',
        header: 'Section',
        size: 180,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-text-primary">
              {row.original.sectionName || `Section ${row.original.sectionNumber}`}
            </div>
            <div className="text-xs text-text-tertiary mt-0.5">
              #{row.original.sectionNumber}
            </div>
          </div>
        ),
      },
      {
        id: 'course',
        accessorFn: (row) => row.courseName,
        header: 'Course',
        size: 200,
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-text-primary">
              {row.original.courseName || '\u2014'}
            </div>
            {row.original.courseCode && (
              <div className="text-xs text-text-tertiary mt-0.5">
                {row.original.courseCode}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'teacher',
        accessorFn: (row) => row.primaryTeacherName,
        header: 'Teacher',
        size: 180,
        cell: ({ row }) => (
          <span className="text-sm text-text-primary">
            {row.original.primaryTeacherName || '\u2014'}
          </span>
        ),
      },
      {
        id: 'period',
        accessorFn: (row) => row.periodName,
        header: 'Period',
        size: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {row.original.periodName || '\u2014'}
          </span>
        ),
      },
      {
        id: 'room',
        accessorFn: (row) => row.locationRoomNumber ?? row.roomNumber,
        header: 'Room',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {row.original.locationRoomNumber || row.original.roomNumber || '\u2014'}
          </span>
        ),
      },
      {
        id: 'enrollment',
        accessorFn: (row) => row.currentEnrollment,
        header: 'Enrollment',
        size: 180,
        enableSorting: false,
        cell: ({ row }) => (
          <CapacityBar
            current={row.original.currentEnrollment}
            max={row.original.maxEnrollment}
          />
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                row.original.isActive ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-xs text-text-secondary">
              {row.original.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ),
      },
      createActionsColumn<SectionResponseDto>({
        cell: ({ row }) => (
          <RowActions
            section={row.original}
            onView={() => onViewSection?.(row.original)}
            onEdit={() => onEditSection?.(row.original)}
            onToggleActive={() => onToggleActive?.(row.original)}
            onViewRoster={() => onViewRoster?.(row.original)}
          />
        ),
      }),
    ],
    [onViewSection, onEditSection, onToggleActive, onViewRoster]
  )

  return (
    <TanstackDataTable
      columns={columns}
      data={sections}
      getRowId={(section) => section.sectionId}
      isLoading={isLoading}
      emptyState={{
        icon: <CalendarDays className="w-12 h-12 text-text-tertiary" />,
        title: 'No sections found',
        description:
          'Create your first class section to start building your schedule.',
      }}
      pagination={{ pageSize: 20 }}
      enableSorting={true}
      onRowClick={onViewSection}
    />
  )
}
