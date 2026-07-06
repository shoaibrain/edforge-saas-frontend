/**
 * RosterSummaryStrip — the single, sticky section-scope metric + save strip.
 *
 * Consolidates what used to be three separate signals (a floating progress bar, an
 * in-grid save badge, and the route-header save indicator) into ONE strip pinned
 * inside the bounded grid box: live present/absent/excused counts, marked progress,
 * one save-status indicator, and the single Save button (so it never scrolls away).
 */

import { Loader2, Save, Check, WifiOff, CloudOff, CheckCircle } from 'lucide-react'
import { ATTENDANCE_STATUS_META, TONE_CLASSES } from '../attendanceStatus'
import type { AttendanceBucket } from '../attendanceStatus'
import type { SaveStatus } from '../../../hooks/useOfflineAttendance'
import { useAcademicsI18n } from '../../../lib/i18n'

function SaveStatusBadge({ status }: { status?: SaveStatus }) {
  const { t } = useAcademicsI18n()
  if (!status || status === 'idle') return null
  const configs: Record<string, { icon: typeof Check; text: string; className: string }> = {
    saved: { icon: Check, text: t('attendance.saveStatus.saved'), className: 'text-[rgb(var(--state-success-fg))]' },
    saving: { icon: Loader2, text: t('attendance.saveStatus.savingEllipsis'), className: 'text-[rgb(var(--state-warning-fg))]' },
    offline: { icon: WifiOff, text: t('attendance.saveStatus.offline'), className: 'text-[rgb(var(--state-danger-fg))]' },
    error: { icon: CloudOff, text: t('attendance.saveStatus.error'), className: 'text-[rgb(var(--state-danger-fg))]' },
  }
  const config = configs[status]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={`flex items-center gap-1 text-xs ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'saving' ? 'animate-spin' : ''}`} />
      {config.text}
    </span>
  )
}

export interface RosterSummaryStripProps {
  marked: number
  total: number
  buckets: { present: number; absent: number; excused: number }
  saveStatus?: SaveStatus
  isPastDate: boolean
  isSaving: boolean
  hasChanges: boolean
  disabled?: boolean
  onSave: () => void
}

const dotFor = (bucket: AttendanceBucket) => {
  // Map the coarse save-summary bucket to a representative status tone dot.
  const status = bucket === 'present' ? 'present' : bucket === 'absent' ? 'absent' : 'excused'
  return TONE_CLASSES[ATTENDANCE_STATUS_META[status].tone].dot
}

export function RosterSummaryStrip({
  marked,
  total,
  buckets,
  saveStatus,
  isPastDate,
  isSaving,
  hasChanges,
  disabled = false,
  onSave,
}: RosterSummaryStripProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const pct = total > 0 ? (marked / total) * 100 : 0
  const complete = marked === total && total > 0

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border-secondary bg-[rgb(var(--surface-secondary)/0.5)] px-4 py-2">
      {complete ? (
        // Humanized completion moment — fires once on the complete edge (the chip
        // mounts), gently popping in. `v2-pop-in` is reduced-motion-gated.
        <span className="v2-pop-in flex items-center gap-1.5 rounded-full bg-[rgb(var(--state-success-bg)/0.18)] px-2.5 py-1 text-xs font-medium text-[rgb(var(--state-success-fg))]">
          <CheckCircle className="h-3.5 w-3.5" />
          {t('attendance.grid.allMarked', { total: formatNumber(total) })}
        </span>
      ) : (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dotFor('present')}`} />
            <span className="font-medium tabular-nums text-text-primary">{formatNumber(buckets.present)}</span>
            <span className="text-text-tertiary">{t('attendance.status.present.label')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dotFor('absent')}`} />
            <span className="font-medium tabular-nums text-text-primary">{formatNumber(buckets.absent)}</span>
            <span className="text-text-tertiary">{t('attendance.status.absent.label')}</span>
          </span>
          {buckets.excused > 0 && (
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dotFor('excused')}`} />
              <span className="font-medium tabular-nums text-text-primary">{formatNumber(buckets.excused)}</span>
              <span className="text-text-tertiary">{t('attendance.status.excused.label')}</span>
            </span>
          )}
        </div>
      )}

      <div className="ms-auto flex items-center gap-3">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              complete ? 'bg-[rgb(var(--state-success-fg))]' : 'bg-[rgb(var(--state-info-fg))]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-text-tertiary">
          {t('attendance.grid.markedCount', { marked: formatNumber(marked), total: formatNumber(total) })}
        </span>
        <SaveStatusBadge status={saveStatus} />
        {!isPastDate && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || marked === 0 || !hasChanges || disabled}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[rgb(var(--action-primary-bg))] px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] transition-colors hover:bg-[rgb(var(--action-primary-bg-hover))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('attendance.actions.saveAttendance')}
          </button>
        )}
      </div>
    </div>
  )
}
