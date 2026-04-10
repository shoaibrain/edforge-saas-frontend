/**
 * AttendanceRecordsList — Recent attendance records with status pills
 */

import { useState } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection, StatusPill, DashedDivider } from '@edforge/ui'
import type { StatusPillVariant } from '@edforge/ui'
import type { AttendanceRecord } from '../../hooks/usePortalStudentAttendance'

export interface AttendanceRecordsListProps {
  records?: AttendanceRecord[]
  loading?: boolean
  staggerIndex?: number
}

function statusToVariant(status: string): StatusPillVariant {
  switch (status) {
    case 'present': return 'present'
    case 'absent': return 'absent'
    case 'late': return 'late'
    case 'excused': return 'excused'
    default: return 'pending'
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function AttendanceRecordsList({
  records,
  loading,
  staggerIndex = 4,
}: AttendanceRecordsListProps) {
  const { t } = useTranslation('portal')
  const [showAll, setShowAll] = useState(false)

  if (loading) {
    return (
      <ContentSection heading={t('attendance.recentRecords')} staggerIndex={staggerIndex}>
        <div className="space-y-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-[var(--v2-bg-elevated)] v2-skeleton-pulse" />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (!records || records.length === 0) {
    return (
      <ContentSection heading={t('attendance.recentRecords')} staggerIndex={staggerIndex}>
        <p className="text-sm py-4" style={{ color: 'var(--v2-text-muted)' }}>
          {t('attendance.noRecords')}
        </p>
      </ContentSection>
    )
  }

  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const visible = showAll ? sorted : sorted.slice(0, 10)

  return (
    <ContentSection heading={t('attendance.recentRecords')} staggerIndex={staggerIndex}>
      <div
        className="rounded-xl border mt-3 overflow-hidden"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        {visible.map((rec, i) => (
          <div key={rec.id}>
            {i > 0 && <DashedDivider className="mx-4 my-0" />}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="text-[12px] font-mono tabular-nums w-28 shrink-0"
                style={{ color: 'var(--v2-text-secondary)' }}
              >
                {formatDate(rec.date)}
              </span>
              <StatusPill
                variant={statusToVariant(rec.status)}
                label={rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
              />
              {rec.notes && (
                <span
                  className="text-[11px] truncate flex-1"
                  style={{ color: 'var(--v2-text-hint)' }}
                >
                  {rec.notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!showAll && sorted.length > 10 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[12px] font-medium mt-2"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          Show all ({sorted.length}) →
        </button>
      )}
    </ContentSection>
  )
}
