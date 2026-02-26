/**
 * Parent Portal — Overview Page
 *
 * Shows a summary of all children with quick-glance GPA and attendance info.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { Card, CardContent, Skeleton } from '@edforge/ui'
import { GraduationCap, CalendarCheck, BookOpen, User } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ChildGrades {
  studentId: string
  gpa: { cumulativeGpa: number; totalCredits: number } | null
  grades: Array<{ gradeId: string; courseName: string; letterGrade?: string }>
}

interface ChildAttendanceSummary {
  totalDays: number
  present: number
  attendanceRate: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentOverviewPage() {
  const { children, activeChild, setActiveChildId } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
        Family Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => (
          <ChildCard
            key={child.studentId}
            studentId={child.studentId}
            name={`${child.firstName} ${child.lastName}`}
            gradeLevel={child.gradeLevel}
            schoolId={activeSchoolId}
            academicYearId={activeSchoolYear?.id}
            isActive={child.studentId === activeChild?.studentId}
            onSelect={() => setActiveChildId(child.studentId)}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// CHILD CARD
// ============================================================================

function ChildCard({
  studentId,
  name,
  gradeLevel,
  schoolId,
  academicYearId,
  isActive,
  onSelect,
}: {
  studentId: string
  name: string
  gradeLevel?: string
  schoolId: string | null
  academicYearId?: string
  isActive: boolean
  onSelect: () => void
}) {
  // Fetch GPA
  const { data: gradesData, isLoading: isGradesLoading } = useQuery({
    queryKey: ['parent-child-grades', studentId, schoolId, academicYearId],
    queryFn: () =>
      apiGet<ChildGrades>(`/academics/students/${studentId}/grades`, {
        schoolId,
        ...(academicYearId && { academicYearId }),
      }),
    enabled: !!studentId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch attendance summary
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['parent-child-attendance', studentId, schoolId, academicYearId],
    queryFn: () =>
      apiGet<ChildAttendanceSummary>(`/academics/students/${studentId}/attendance/summary`, {
        schoolId,
        ...(academicYearId && { academicYearId }),
      }),
    enabled: !!studentId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-teal-500' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{name}</h3>
            {gradeLevel && (
              <p className="text-xs text-[rgb(var(--text-secondary))]">Grade {gradeLevel}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* GPA */}
          <div className="text-center">
            <GraduationCap className="w-4 h-4 text-[rgb(var(--text-tertiary))] mx-auto mb-1" />
            {isGradesLoading ? (
              <Skeleton className="h-5 w-10 mx-auto" />
            ) : (
              <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                {gradesData?.gpa?.cumulativeGpa?.toFixed(2) ?? '-'}
              </p>
            )}
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] uppercase">GPA</p>
          </div>

          {/* Courses */}
          <div className="text-center">
            <BookOpen className="w-4 h-4 text-[rgb(var(--text-tertiary))] mx-auto mb-1" />
            {isGradesLoading ? (
              <Skeleton className="h-5 w-10 mx-auto" />
            ) : (
              <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                {gradesData?.grades?.length ?? '-'}
              </p>
            )}
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] uppercase">Courses</p>
          </div>

          {/* Attendance */}
          <div className="text-center">
            <CalendarCheck className="w-4 h-4 text-[rgb(var(--text-tertiary))] mx-auto mb-1" />
            {isAttendanceLoading ? (
              <Skeleton className="h-5 w-10 mx-auto" />
            ) : (
              <p className={`text-sm font-bold ${
                (attendanceData?.attendanceRate ?? 0) >= 90
                  ? 'text-green-600 dark:text-green-400'
                  : (attendanceData?.attendanceRate ?? 0) >= 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {attendanceData?.attendanceRate != null
                  ? `${attendanceData.attendanceRate.toFixed(0)}%`
                  : '-'}
              </p>
            )}
            <p className="text-[10px] text-[rgb(var(--text-tertiary))] uppercase">Attend.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
