/**
 * AttendanceBySectionCard
 *
 * Full-width bottom-row panel showing today's classroom/section health:
 * attendance taken status, student count, and recorded count.
 * Uses real data from the /academics/attendance/overview endpoint.
 */

import { Check, Clock, Users } from 'lucide-react'

export interface SectionAttendanceItem {
  sectionId: string
  name: string
  status: 'taken' | 'pending'
  studentCount?: number
  recordedCount?: number
}

interface AttendanceBySectionCardProps {
  sections: SectionAttendanceItem[]
  todayRate: number | null
  isLoading: boolean
}

function SectionSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {['Section', 'Students', 'Recorded', 'Status'].map((h) => (
              <th
                key={h}
                className="text-left text-[11px] font-medium pb-2 px-2"
                style={{ color: 'var(--v2-text-hint)', borderBottom: '1px solid var(--v2-border-default)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td className="py-[10px] px-2" style={{ borderBottom: i < 4 ? '1px solid var(--v2-border-default)' : 'none' }}>
                <div className="h-3 rounded v2-skeleton-pulse" style={{ width: `${100 + Math.random() * 80}px`, background: 'var(--v2-bg-elevated)' }} />
              </td>
              <td className="py-[10px] px-2" style={{ borderBottom: i < 4 ? '1px solid var(--v2-border-default)' : 'none' }}>
                <div className="h-3 w-8 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
              </td>
              <td className="py-[10px] px-2" style={{ borderBottom: i < 4 ? '1px solid var(--v2-border-default)' : 'none' }}>
                <div className="h-3 w-10 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
              </td>
              <td className="py-[10px] px-2" style={{ borderBottom: i < 4 ? '1px solid var(--v2-border-default)' : 'none' }}>
                <div className="h-5 w-16 rounded-md v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
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
}: AttendanceBySectionCardProps) {
  const takenCount = sections.filter((s) => s.status === 'taken').length

  return (
    <div
      className="rounded-xl border"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          Classroom attendance
        </span>
        <div className="flex items-center gap-3">
          {sections.length > 0 && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--v2-text-hint)' }}>
              {takenCount}/{sections.length} completed
            </span>
          )}
          {todayRate != null && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--v2-warning)' }}>
              {todayRate.toFixed(1)}% today
            </span>
          )}
        </div>
      </div>

      {/* Section table */}
      {isLoading ? (
        <SectionSkeleton />
      ) : sections.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--v2-text-hint)' }}>
          No sections scheduled today
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  className="text-left text-[11px] font-medium pb-2 px-2"
                  style={{ color: 'var(--v2-text-hint)', borderBottom: '1px solid var(--v2-border-default)' }}
                >
                  Section
                </th>
                <th
                  className="text-center text-[11px] font-medium pb-2 px-2"
                  style={{ color: 'var(--v2-text-hint)', borderBottom: '1px solid var(--v2-border-default)', width: 80 }}
                >
                  Students
                </th>
                <th
                  className="text-center text-[11px] font-medium pb-2 px-2"
                  style={{ color: 'var(--v2-text-hint)', borderBottom: '1px solid var(--v2-border-default)', width: 80 }}
                >
                  Recorded
                </th>
                <th
                  className="text-right text-[11px] font-medium pb-2 px-2"
                  style={{ color: 'var(--v2-text-hint)', borderBottom: '1px solid var(--v2-border-default)', width: 90 }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section, i) => (
                <tr key={section.sectionId}>
                  <td
                    className="py-[10px] px-2"
                    style={{
                      borderBottom: i < sections.length - 1 ? '1px solid var(--v2-border-default)' : 'none',
                    }}
                  >
                    <span className="text-xs" style={{ color: 'var(--v2-text-muted)' }}>
                      {section.name}
                    </span>
                  </td>
                  <td
                    className="text-center py-[10px] px-2"
                    style={{
                      borderBottom: i < sections.length - 1 ? '1px solid var(--v2-border-default)' : 'none',
                    }}
                  >
                    {section.studentCount != null ? (
                      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--v2-text-hint)' }}>
                        <Users className="w-[10px] h-[10px]" />
                        {section.studentCount}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>—</span>
                    )}
                  </td>
                  <td
                    className="text-center py-[10px] px-2"
                    style={{
                      borderBottom: i < sections.length - 1 ? '1px solid var(--v2-border-default)' : 'none',
                    }}
                  >
                    {section.recordedCount != null && section.studentCount != null ? (
                      <span className="text-[11px]" style={{
                        color: section.recordedCount === section.studentCount
                          ? 'var(--v2-brand-primary)'
                          : 'var(--v2-text-hint)',
                      }}>
                        {section.recordedCount}/{section.studentCount}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>—</span>
                    )}
                  </td>
                  <td
                    className="text-right py-[10px] px-2"
                    style={{
                      borderBottom: i < sections.length - 1 ? '1px solid var(--v2-border-default)' : 'none',
                    }}
                  >
                    {section.status === 'taken' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                        style={{
                          background: 'var(--v2-accent-enrollment)',
                          color: 'var(--v2-brand-primary)',
                        }}
                      >
                        <Check className="w-[9px] h-[9px]" />
                        Taken
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                        style={{
                          background: 'var(--v2-accent-attendance)',
                          color: 'var(--v2-warning)',
                        }}
                      >
                        <Clock className="w-[9px] h-[9px]" />
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
