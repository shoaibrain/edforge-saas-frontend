/**
 * AttendanceCommandBar — the single command row that replaces the old sub-tab
 * strip. BS/AD date navigation (reuses DateSelector) · a counting-policy chip ·
 * a derived scope indicator (School-wide vs My sections — read-only; the
 * aggregate is scoped server-side by the signed-in user's role) · the IEMIS
 * Export trigger. No per-page H1 (the classrooms tab bar names the page).
 */

import { Gauge, Download, School, UserRound } from 'lucide-react'
import type { AttendancePolicyResponseDto } from '@aibrains/shared-types'
import { DateSelector } from '../DateSelector'
import { useAcademicsI18n } from '../../../lib/i18n'

interface AttendanceCommandBarProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
  policy?: AttendancePolicyResponseDto
  isSchoolWide: boolean
  canExport: boolean
  onExport: () => void
}

export function AttendanceCommandBar({
  selectedDate,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onToday,
  policy,
  isSchoolWide,
  canExport,
  onExport,
}: AttendanceCommandBarProps) {
  const { t } = useAcademicsI18n()

  const modeLabel =
    policy?.effectiveMode === 'daily_presence'
      ? t('attendance.policy.dailyPresence')
      : t('attendance.policy.perSection')
  const atRisk = policy?.countingPolicy?.atRiskThresholdPct ?? 90
  const archetype = policy?.archetype
  const attending = policy?.countingPolicy?.attendingCategories?.join(', ')
  const policyTooltip = policy
    ? t('attendance.dashboard.commandBar.policyTooltip', {
        attending: attending ?? '',
        excused:
          policy.countingPolicy?.excusedTreatment === 'present_for_rate'
            ? t('attendance.dashboard.commandBar.excusedPresent')
            : t('attendance.dashboard.commandBar.excusedAbsent'),
      })
    : undefined

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onPrevious={onPreviousDay}
        onNext={onNextDay}
        onToday={onToday}
      />

      {policy && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border-primary)/0.35)] px-2.5 py-1 text-2xs text-[rgb(var(--text-tertiary))]"
          title={policyTooltip}
        >
          <Gauge className="h-3.5 w-3.5 text-[rgb(var(--text-tertiary))]" aria-hidden="true" />
          <span className="text-[rgb(var(--text-secondary))]">{modeLabel}</span>
          {archetype && (
            <>
              <span aria-hidden="true">·</span>
              <span>{archetype}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{t('attendance.dashboard.commandBar.atRiskShort', { pct: atRisk })}</span>
        </span>
      )}

      <div className="ml-auto flex items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1.5 text-2xs font-medium text-[rgb(var(--text-tertiary))]"
          title={t('attendance.dashboard.commandBar.scopeTooltip')}
        >
          {isSchoolWide ? (
            <School className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isSchoolWide
            ? t('attendance.dashboard.commandBar.scopeSchool')
            : t('attendance.dashboard.commandBar.scopeMine')}
        </span>

        {canExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] px-3 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('attendance.dashboard.commandBar.export')}
          </button>
        )}
      </div>
    </div>
  )
}
