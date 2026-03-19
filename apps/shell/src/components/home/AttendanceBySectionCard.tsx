/**
 * AttendanceBySectionCard
 *
 * Bottom-row panel showing today's sections with Taken/Pending status.
 * Uses section list from academics API.
 */

import { Check, Clock } from 'lucide-react'

export interface SectionAttendanceItem {
  sectionId: string
  name: string
  status: 'taken' | 'pending'
}

interface AttendanceBySectionCardProps {
  sections: SectionAttendanceItem[]
  todayRate: number | null
  isLoading: boolean
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-[9px]"
          style={{ borderBottom: i < 4 ? '1px solid var(--v2-border-default, rgba(255,255,255,0.06))' : 'none' }}
        >
          <div
            className="h-3 rounded v2-skeleton-pulse"
            style={{
              width: `${100 + Math.random() * 60}px`,
              background: 'var(--v2-bg-elevated)',
            }}
          />
          <div
            className="h-5 w-16 rounded-md v2-skeleton-pulse"
            style={{ background: 'var(--v2-bg-elevated)' }}
          />
        </div>
      ))}
    </div>
  )
}

export function AttendanceBySectionCard({
  sections,
  todayRate,
  isLoading,
}: AttendanceBySectionCardProps) {
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
          Attendance by section
        </span>
        {todayRate != null && (
          <span className="text-[11px] font-medium" style={{ color: 'var(--v2-warning)' }}>
            {todayRate.toFixed(1)}% today
          </span>
        )}
      </div>

      {/* Section list */}
      {isLoading ? (
        <SectionSkeleton />
      ) : sections.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--v2-text-hint)' }}>
          No sections scheduled today
        </p>
      ) : (
        <div className="flex flex-col">
          {sections.map((section, i) => (
            <div
              key={section.sectionId}
              className="flex items-center justify-between py-[9px]"
              style={{
                borderBottom:
                  i < sections.length - 1
                    ? '1px solid var(--v2-border-default)'
                    : 'none',
              }}
            >
              <span className="text-xs" style={{ color: 'var(--v2-text-muted)' }}>
                {section.name}
              </span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
