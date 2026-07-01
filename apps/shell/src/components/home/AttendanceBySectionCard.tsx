/**
 * AttendanceBySectionCard
 *
 * Full-width bottom-row panel showing today's classroom/section health:
 * attendance taken status, student count, recorded count, attendance rate,
 * and completion status. Rows are clickable for navigation to section detail.
 *
 * Sprint 2 enhancements:
 * - 2.1: Per-section attendance rate in type
 * - 2.2: Rate column with color coding
 * - 2.3: Clickable rows navigating to section attendance
 * - 2.4: Section summary header bar
 * - 2.5: Empty state for no academic year
 * - 2.6: Table accessibility (caption, scope, aria-labels, keyboard nav)
 */

import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Clock, Users, Settings } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'

// Ticket 2.1: extended type with optional attendanceRate
export interface SectionAttendanceItem {
  sectionId: string
  name: string
  status: 'taken' | 'partial' | 'pending'
  studentCount?: number
  recordedCount?: number
  attendanceRate?: number
}

interface AttendanceBySectionCardProps {
  sections: SectionAttendanceItem[]
  todayRate: number | null
  isLoading: boolean
  /** When undefined, shows empty state directing user to settings (Ticket 2.5) */
  academicYearId?: string
  /** Render only the summary bar + table (no card chrome / title) for WidgetCard framing. */
  bare?: boolean
}

// Ticket 2.2: color coding for attendance rate
function getRateColor(rate: number): string {
  if (rate >= 90) return '#1D9E75'
  if (rate >= 75) return 'rgb(var(--state-warning-fg))'
  return 'rgb(var(--state-danger-fg))'
}

function SectionSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {['Section', 'Students', 'Recorded', 'Rate', 'Status'].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-medium pb-2 px-2 text-[rgb(var(--text-tertiary))]"
                scope="col"
                style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td className="py-2.5 px-2" style={{ borderBottom: i < 4 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none' }}>
                <div className="h-3 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" style={{ width: `${100 + Math.random() * 80}px` }} />
              </td>
              <td className="py-2.5 px-2" style={{ borderBottom: i < 4 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none' }}>
                <div className="h-3 w-8 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
              </td>
              <td className="py-2.5 px-2" style={{ borderBottom: i < 4 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none' }}>
                <div className="h-3 w-10 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
              </td>
              <td className="py-2.5 px-2" style={{ borderBottom: i < 4 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none' }}>
                <div className="h-3 w-10 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
              </td>
              <td className="py-2.5 px-2" style={{ borderBottom: i < 4 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none' }}>
                <div className="h-5 w-16 rounded-md v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AttendanceBySectionCard({
  sections,
  todayRate,
  isLoading,
  academicYearId,
  bare,
}: AttendanceBySectionCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const takenCount = sections.filter((s) => s.status === 'taken').length
  const recordedCount = sections.filter((s) => s.status !== 'pending').length

  // Ticket 2.3: navigate to section attendance page
  const handleRowClick = useCallback(
    (sectionId: string) => {
      navigate({
        to: '/academics/$',
        params: { _splat: `classrooms/${sectionId}` },
        search: { tab: 'progress', view: 'attendance' },
      })
    },
    [navigate],
  )

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, sectionId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleRowClick(sectionId)
      }
    },
    [handleRowClick],
  )

  const body = (
    <>
      {/* Ticket 2.4: Summary header bar */}
      {!isLoading && sections.length > 0 && (
        <div className="flex items-center gap-3 mb-3 text-xs text-[rgb(var(--text-tertiary))]">
          <span>{sections.length} section{sections.length !== 1 ? 's' : ''} total</span>
          <span className="text-[rgb(var(--border-primary)/0.35)]">·</span>
          <span className={takenCount === sections.length ? 'text-[rgb(var(--accent-enrollment-text))]' : ''}>
            {recordedCount}/{sections.length} recorded
          </span>
          {todayRate != null && (
            <>
              <span className="text-[rgb(var(--border-primary)/0.35)]">·</span>
              <span
                // allow-presentation-style: overall attendance-rate severity color
                style={{ color: getRateColor(todayRate) }}
              >
                {todayRate.toFixed(1)}% overall
              </span>
            </>
          )}
        </div>
      )}

      {/* Ticket 2.5: Empty state for no academic year */}
      {!isLoading && !academicYearId ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Settings className="w-5 h-5 text-[rgb(var(--text-disabled))]" />
          <p className="text-sm text-center text-[rgb(var(--text-tertiary))]">
            {t('homeV2.attendance.noAcademicYear')}
          </p>
          <a
            href="/settings/organization"
            className="text-xs font-medium transition-opacity hover:opacity-80 text-[#1D9E75]"
          >
            {t('homeV2.attendance.setupAcademicYear')}
          </a>
        </div>
      ) : isLoading ? (
        <SectionSkeleton />
      ) : sections.length === 0 ? (
        <p className="text-sm py-6 text-center text-[rgb(var(--text-tertiary))]">
          {t('homeV2.attendance.noSectionsToday')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            {/* Ticket 2.6: visually hidden caption */}
            <caption className="sr-only">
              Today&apos;s classroom attendance status by section. {takenCount} of {sections.length} sections have recorded attendance.
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left text-xs font-medium pb-2 px-2 text-[rgb(var(--text-tertiary))]"
                  style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)' }}
                >
                  {t('homeV2.attendance.section')}
                </th>
                <th
                  scope="col"
                  className="text-center text-xs font-medium pb-2 px-2 text-[rgb(var(--text-tertiary))]"
                  style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)', width: 80 }}
                >
                  {t('homeV2.attendance.students')}
                </th>
                <th
                  scope="col"
                  className="text-center text-xs font-medium pb-2 px-2 text-[rgb(var(--text-tertiary))]"
                  style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)', width: 80 }}
                >
                  {t('homeV2.attendance.recordedCol')}
                </th>
                {/* Ticket 2.2: Rate column */}
                <th
                  scope="col"
                  className="text-center text-xs font-medium pb-2 px-2 text-[rgb(var(--text-tertiary))]"
                  style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)', width: 70 }}
                >
                  {t('homeV2.attendance.rate')}
                </th>
                <th
                  scope="col"
                  className="text-right text-xs font-medium pb-2 px-2 text-[rgb(var(--text-tertiary))]"
                  style={{ borderBottom: '1px solid rgb(var(--border-primary) / 0.35)', width: 90 }}
                >
                  {t('homeV2.attendance.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, i) => {
                // Ticket 2.2: compute rate from recordedCount/studentCount if not provided
                const rate = section.attendanceRate
                  ?? (section.studentCount && section.recordedCount
                    ? (section.recordedCount / section.studentCount) * 100
                    : undefined)

                return (
                  <tr
                    key={section.sectionId}
                    // Ticket 2.3: clickable rows
                    onClick={() => handleRowClick(section.sectionId)}
                    onKeyDown={(e) => handleRowKeyDown(e, section.sectionId)}
                    tabIndex={0}
                    role="link"
                    style={{ cursor: 'pointer' }}
                    className="transition-colors hover:bg-[rgb(var(--background-tertiary))] focus-visible:bg-[rgb(var(--background-tertiary))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1D9E75]"
                  >
                    <td
                      className="py-2.5 px-2"
                      style={{
                        borderBottom: i < sections.length - 1 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none',
                      }}
                    >
                      <span className="text-xs text-[rgb(var(--text-tertiary))]">
                        {section.name}
                      </span>
                    </td>
                    <td
                      className="text-center py-2.5 px-2"
                      style={{
                        borderBottom: i < sections.length - 1 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none',
                      }}
                    >
                      {section.studentCount != null ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--text-tertiary))]">
                          <Users className="w-2.5 h-2.5" />
                          {section.studentCount}
                        </span>
                      ) : (
                        <span className="text-xs text-[rgb(var(--text-disabled))]">—</span>
                      )}
                    </td>
                    <td
                      className="text-center py-2.5 px-2"
                      style={{
                        borderBottom: i < sections.length - 1 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none',
                      }}
                    >
                      {section.recordedCount != null && section.studentCount != null ? (
                        <span className={`text-xs ${section.recordedCount === section.studentCount ? 'text-[rgb(var(--accent-enrollment-text))]' : 'text-[rgb(var(--text-tertiary))]'}`}>
                          {section.recordedCount}/{section.studentCount}
                        </span>
                      ) : (
                        <span className="text-xs text-[rgb(var(--text-disabled))]">—</span>
                      )}
                    </td>
                    {/* Ticket 2.2: Rate cell with color coding */}
                    <td
                      className="text-center py-2.5 px-2"
                      style={{
                        borderBottom: i < sections.length - 1 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none',
                      }}
                    >
                      {rate != null ? (
                        <span
                          // allow-presentation-style: per-section attendance-rate severity color
                          className="text-xs font-medium"
                          style={{ color: getRateColor(rate) }}
                        >
                          {rate.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-[rgb(var(--text-disabled))]">—</span>
                      )}
                    </td>
                    <td
                      className="text-right py-2.5 px-2"
                      style={{
                        borderBottom: i < sections.length - 1 ? '1px solid rgb(var(--border-primary) / 0.35)' : 'none',
                      }}
                    >
                      {section.status === 'taken' ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-[rgb(var(--accent-enrollment)/0.12)] text-[rgb(var(--accent-enrollment-text))]"
                          aria-label="Attendance taken"
                        >
                          <Check className="w-2 h-2" />
                          {t('homeV2.attendance.taken')}
                        </span>
                      ) : section.status === 'partial' ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-[rgb(var(--accent-academics)/0.12)] text-[rgb(var(--accent-academics-text))]"
                          aria-label="Attendance partially taken"
                        >
                          <Clock className="w-2 h-2" />
                          {t('homeV2.attendance.partial')}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-[rgb(var(--accent-attendance)/0.12)] text-[rgb(var(--state-warning-fg))]"
                          aria-label="Attendance pending"
                        >
                          <Clock className="w-2 h-2" />
                          {t('homeV2.attendance.pending')}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )

  if (bare) return body

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('homeV2.attendance.classroomAttendance')}
        </span>
        {todayRate != null && (
          <span className="text-xs font-medium text-[rgb(var(--state-warning-fg))]">
            {todayRate.toFixed(1)}% today
          </span>
        )}
      </div>
      {body}
    </div>
  )
}
