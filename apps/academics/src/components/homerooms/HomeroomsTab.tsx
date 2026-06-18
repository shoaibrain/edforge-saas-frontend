/**
 * HomeroomsTab
 *
 * Homeroom management surface (FE-S4) for the Classrooms page
 * (`?tab=homerooms`). Lists existing homerooms (type-badged), offers an
 * assisted "Set up homerooms" flow (one per enabled grade, splittable,
 * class-teacher required), and a per-homeroom "Assign students" action.
 *
 * A homeroom is a Section with `sectionType:'homeroom'`. PABSON schools take
 * ONE daily homeroom roll-call per student.
 */

import { useMemo, useState } from 'react'
import { Home, UsersRound, UserPlus, Wand2 } from 'lucide-react'
import {
  TanstackDataTable,
  createActionsColumn,
  StatusBadge,
  StatCard,
  Button,
  type ColumnDef,
} from '@edforge/ui'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear } from '../../hooks/useSchool'
import { useHomerooms } from '../../hooks/useHomeroom'
import { NoCurrentAcademicYearEmptyState } from '../common'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { HomeroomSetupModal } from './HomeroomSetupModal'
import { HomeroomAssignDrawer } from './HomeroomAssignDrawer'

// ============================================================================
// COMPONENT
// ============================================================================

export function HomeroomsTab() {
  const schoolId = useActiveSchoolId() || ''
  const { data: currentYear, isLoading: yearLoading } = useCurrentAcademicYear(schoolId)
  const yearId = currentYear?.yearId

  const {
    data: homerooms = [],
    isLoading,
  } = useHomerooms(schoolId, yearId, !!schoolId && !!yearId)

  const [showSetup, setShowSetup] = useState(false)
  const [assignTarget, setAssignTarget] = useState<SectionResponseDto | null>(null)

  const existingSectionNumbers = useMemo(
    () => new Set(homerooms.map((h) => h.sectionNumber)),
    [homerooms],
  )

  const stats = useMemo(() => {
    const count = homerooms.length
    const assigned = homerooms.reduce((sum, h) => sum + h.currentEnrollment, 0)
    const withTeacher = homerooms.filter((h) => !!h.primaryTeacherId).length
    return { count, assigned, withTeacher }
  }, [homerooms])

  const columns: ColumnDef<SectionResponseDto, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'sectionNumber',
        header: 'Homeroom',
        size: 220,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(var(--accent-academics)/0.1)]">
              <Home className="w-4 h-4 text-[rgb(var(--accent-academics-text))]" />
            </div>
            <div>
              <div className="font-medium text-text-primary">
                {row.original.sectionName || `Homeroom ${row.original.sectionNumber}`}
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">#{row.original.sectionNumber}</div>
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        size: 110,
        enableSorting: false,
        cell: () => (
          <StatusBadge tone="info" dot>
            Homeroom
          </StatusBadge>
        ),
      },
      {
        id: 'teacher',
        accessorFn: (row) => row.primaryTeacherName,
        header: 'Class Teacher',
        size: 180,
        cell: ({ row }) => (
          <span className="text-sm text-text-primary">
            {row.original.primaryTeacherName || '—'}
          </span>
        ),
      },
      {
        id: 'enrollment',
        accessorFn: (row) => row.currentEnrollment,
        header: 'Students',
        size: 110,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-text-secondary">
            {row.original.currentEnrollment} / {row.original.maxEnrollment}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => (
          <StatusBadge tone={row.original.isActive ? 'success' : 'neutral'} dot>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        ),
      },
      createActionsColumn<SectionResponseDto>({
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setAssignTarget(row.original)
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign
          </Button>
        ),
      }),
    ],
    [],
  )

  if (yearLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!yearId) {
    return (
      <NoCurrentAcademicYearEmptyState secondaryMessage="Set up an academic year before designating homerooms." />
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Homerooms"
          value={String(stats.count)}
          icon={Home}
          accentColor="rgb(var(--accent-academics)/0.1)"
          iconColor="rgb(var(--accent-academics))"
          barColor="rgb(var(--accent-academics))"
          hint="for daily roll-call"
          loading={isLoading}
        />
        <StatCard
          label="Students Assigned"
          value={String(stats.assigned)}
          icon={UsersRound}
          accentColor="rgb(var(--accent-enrollment)/0.1)"
          iconColor="rgb(var(--accent-enrollment))"
          barColor="rgb(var(--accent-enrollment))"
          hint="across all homerooms"
          loading={isLoading}
        />
        <StatCard
          label="With Class Teacher"
          value={`${stats.withTeacher} / ${stats.count}`}
          icon={UserPlus}
          accentColor="rgb(var(--accent-reports)/0.1)"
          iconColor="rgb(var(--accent-reports))"
          barColor="rgb(var(--accent-reports))"
          hint="primary teacher set"
          loading={isLoading}
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-text-secondary">
          A homeroom is where each student's single daily attendance roll-call is taken.
        </p>
        <Button onClick={() => setShowSetup(true)}>
          <Wand2 className="w-4 h-4" />
          Set up homerooms
        </Button>
      </div>

      {/* Homeroom list */}
      <TanstackDataTable
        columns={columns}
        data={homerooms}
        getRowId={(s) => s.sectionId}
        isLoading={isLoading}
        emptyState={{
          icon: <Home className="w-12 h-12 text-text-tertiary" />,
          title: 'No homerooms yet',
          description:
            'Use "Set up homerooms" to create one homeroom per grade for daily attendance.',
        }}
        pagination={{ pageSize: 20 }}
        enableSorting
        maxHeight="calc(100vh - 28rem)"
      />

      {/* Setup flow */}
      {showSetup && (
        <HomeroomSetupModal
          open={showSetup}
          onClose={() => setShowSetup(false)}
          schoolId={schoolId}
          academicYearId={yearId}
          existingSectionNumbers={existingSectionNumbers}
        />
      )}

      {/* Assign students */}
      {assignTarget && (
        <HomeroomAssignDrawer
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          schoolId={schoolId}
          academicYearId={yearId}
          homeroom={assignTarget}
        />
      )}
    </div>
  )
}
