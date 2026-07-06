/**
 * Academic Calendar Module
 *
 * Academic year management page. View all academic years,
 * set one as current, and advance statuses with business-rule enforcement.
 */

import { useMemo, useState, useCallback } from 'react'
import {
  Calendar,
  CalendarDays,
  Star,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button, ContextBar, ContextBarYear, ContextBarSep } from '@edforge/ui'
import { ConfirmationDialog } from '../../components/common'
import {
  useAcademicYears,
  useCurrentAcademicYear,
  useSetCurrentAcademicYear,
  useUpdateAcademicYearStatus,
} from '../../hooks'
import { useAcademicsI18n } from '../../lib/i18n'
import { useActiveSchoolId } from '../../stores/app.store'
import type { AcademicYearResponseDto } from '../../services/school.service'

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  AcademicYearResponseDto['status'],
  { bg: string; text: string; dot: string }
> = {
  planning: {
    bg: 'bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-fg))]/20',
    text: 'text-[rgb(var(--state-info-fg))] ',
    dot: 'bg-[rgb(var(--state-info-fg))]',
  },
  active: {
    bg: 'bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-fg)/0.2)]',
    text: 'text-[rgb(var(--state-success-fg))] ',
    dot: 'bg-[rgb(var(--state-success-fg))]',
  },
  completed: {
    bg: 'bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/20',
    text: 'text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
  archived: {
    bg: 'bg-[rgb(var(--background-tertiary))] dark:bg-[rgb(var(--background-tertiary)/0.2)]',
    text: 'text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]',
    dot: 'bg-[rgb(var(--background-tertiary))]',
  },
}

// Forward-only status transitions
const NEXT_STATUS: Record<
  AcademicYearResponseDto['status'],
  AcademicYearResponseDto['status'] | null
> = {
  planning: 'active',
  active: 'completed',
  completed: 'archived',
  archived: null,
}

function statusLabelKey(status: AcademicYearResponseDto['status']) {
  return `calendarModule.status.${status}`
}

function actionLabelKey(status: AcademicYearResponseDto['status']) {
  return `calendarModule.actions.${status}`
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function AcademicYearStatusBadge({
  status,
}: {
  status: AcademicYearResponseDto['status']
}) {
  const { t } = useAcademicsI18n()
  const config = statusConfig[status] || statusConfig.planning
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {t(statusLabelKey(status))}
    </span>
  )
}

// ============================================================================
// ACADEMIC YEAR CARD
// ============================================================================

interface AcademicYearCardProps {
  year: AcademicYearResponseDto
  onSetCurrent: (year: AcademicYearResponseDto) => void
  onAdvanceStatus: (year: AcademicYearResponseDto) => void
  isSettingCurrent: boolean
  isUpdatingStatus: boolean
}

function AcademicYearCard({
  year,
  onSetCurrent,
  onAdvanceStatus,
  isSettingCurrent,
  isUpdatingStatus,
}: AcademicYearCardProps) {
  const { t, formatDate } = useAcademicsI18n()
  const nextStatus = NEXT_STATUS[year.status]
  const actionLabel = t(actionLabelKey(year.status))

  // Business Rule 2: Only active or planning years can be set as current
  const canSetCurrent =
    !year.isCurrent && (year.status === 'active' || year.status === 'planning')

  // Business Rule 5: Cannot archive a year that is current
  const canAdvanceStatus =
    nextStatus !== null && !(nextStatus === 'archived' && year.isCurrent)

  const startDate = formatDate(year.startDate, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const endDate = formatDate(year.endDate, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className={`bg-surface-secondary rounded-xl border p-5 transition-all ${
        year.isCurrent
          ? 'border-[rgb(var(--state-success-border)/0.50)] ring-1 ring-[rgb(var(--state-success-border)/0.35)]'
          : 'border-border-secondary hover:border-border-primary'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate">
            {year.name}
          </h3>
          <p className="text-sm text-text-secondary mt-0.5">
            {startDate} — {endDate}
          </p>
        </div>
        <div className="flex items-center gap-2 ms-3 flex-shrink-0">
          <AcademicYearStatusBadge status={year.status} />
          {year.isCurrent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-fg)/0.2)] text-[rgb(var(--state-success-fg))] ">
              <CheckCircle2 className="w-3 h-3" />
              {t('calendarModule.current')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-secondary">
        {canSetCurrent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetCurrent(year)}
            disabled={isSettingCurrent}
            isLoading={isSettingCurrent}
          >
            <Star className="w-3.5 h-3.5 me-1.5" />
            {t('calendarModule.actions.setCurrent')}
          </Button>
        )}
        {canAdvanceStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAdvanceStatus(year)}
            disabled={isUpdatingStatus}
            isLoading={isUpdatingStatus}
          >
            <ChevronRight className="w-3.5 h-3.5 me-1" />
            {actionLabel}
          </Button>
        )}
        {year.isCurrent && nextStatus === 'archived' && (
          <p className="text-xs text-text-tertiary italic">
            {t('calendarModule.archiveCurrentHint')}
          </p>
        )}
        {!canSetCurrent && !canAdvanceStatus && !year.isCurrent && year.status === 'archived' && (
          <p className="text-xs text-text-tertiary italic">
            {t(statusLabelKey('archived'))}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
  isLoading = false,
}: {
  icon: typeof Calendar
  label: string
  value: string | number
  accent: string
  bg: string
  isLoading?: boolean
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-surface-primary rounded animate-pulse mt-0.5" />
          ) : (
            <p className="text-xl font-semibold text-text-primary">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY / ERROR / NO SCHOOL STATES
// ============================================================================

function NoSchoolSelected() {
  const { t } = useAcademicsI18n()
  return (
    <div className="min-h-96 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-[rgb(var(--state-warning-fg))]" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {t('calendarModule.noSchool.title')}
        </h3>
        <p className="text-text-secondary">
          {t('calendarModule.noSchool.description')}
        </p>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useAcademicsI18n()
  return (
    <div className="min-h-96 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-fg)/0.2)] flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {t('calendarModule.error.title')}
        </h3>
        <p className="text-text-secondary mb-4">
          {t('calendarModule.error.description')}
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 me-2" />
          {t('calendarModule.error.retry')}
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  const { t } = useAcademicsI18n()
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
      <Calendar className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
      <h4 className="text-lg font-medium text-text-primary mb-2">
        {t('calendarModule.empty.title')}
      </h4>
      <p className="text-text-secondary max-w-md mx-auto">
        {t('calendarModule.empty.description')}
      </p>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CalendarModule() {
  const { t, formatDate, formatNumber } = useAcademicsI18n()
  const activeSchoolId = useActiveSchoolId()
  const schoolId = activeSchoolId ?? ''

  const {
    data: academicYears,
    isLoading,
    isError,
    refetch,
  } = useAcademicYears(schoolId, !!activeSchoolId)

  const { data: currentYear } = useCurrentAcademicYear(
    schoolId,
    !!activeSchoolId
  )

  const setCurrentMutation = useSetCurrentAcademicYear()
  const updateStatusMutation = useUpdateAcademicYearStatus()

  // Confirmation dialog state
  const [confirmSetCurrent, setConfirmSetCurrent] =
    useState<AcademicYearResponseDto | null>(null)
  const [confirmAdvanceStatus, setConfirmAdvanceStatus] =
    useState<AcademicYearResponseDto | null>(null)

  // Computed stats
  const stats = useMemo(() => {
    if (!academicYears || academicYears.length === 0) {
      return { total: 0, active: 0, planning: 0, currentName: t('calendarModule.noneSet') }
    }
    return {
      total: academicYears.length,
      active: academicYears.filter((y) => y.status === 'active').length,
      planning: academicYears.filter((y) => y.status === 'planning').length,
      currentName: currentYear?.name ?? t('calendarModule.noneSet'),
    }
  }, [academicYears, currentYear, t])

  // Handlers
  const handleSetCurrent = useCallback((year: AcademicYearResponseDto) => {
    setConfirmSetCurrent(year)
  }, [])

  const handleConfirmSetCurrent = async () => {
    if (!confirmSetCurrent || !activeSchoolId) return
    try {
      await setCurrentMutation.mutateAsync({
        schoolId: activeSchoolId,
        yearId: confirmSetCurrent.yearId,
      })
      setConfirmSetCurrent(null)
    } catch {
      // Error handled in mutation hook
    }
  }

  const handleAdvanceStatus = useCallback((year: AcademicYearResponseDto) => {
    setConfirmAdvanceStatus(year)
  }, [])

  const handleConfirmAdvanceStatus = async () => {
    if (!confirmAdvanceStatus || !activeSchoolId) return
    const nextStatus = NEXT_STATUS[confirmAdvanceStatus.status]
    if (!nextStatus) return
    try {
      await updateStatusMutation.mutateAsync({
        schoolId: activeSchoolId,
        yearId: confirmAdvanceStatus.yearId,
        status: nextStatus,
      })
      setConfirmAdvanceStatus(null)
    } catch {
      // Error handled in mutation hook
    }
  }

  // No school selected
  if (!activeSchoolId) {
    return (
      <div className="min-h-full">
        <NoSchoolSelected />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header — operating context, not a page title (breadcrumb says Calendar) */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-5">
          <ContextBar
            divider={false}
            meta={
              <>
                {currentYear?.name ? <ContextBarYear>{currentYear.name}</ContextBarYear> : null}
                {currentYear?.name ? <ContextBarSep /> : null}
                <span>
                  {formatDate(new Date(), {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            }
            description={
              <p className="text-sm text-text-secondary">
                {t('calendarModule.description')}
              </p>
            }
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={CalendarDays}
            label={t('calendarModule.stats.currentYear')}
            value={stats.currentName}
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
            isLoading={isLoading}
          />
          <StatCard
            icon={Calendar}
            label={t('calendarModule.stats.totalYears')}
            value={formatNumber(stats.total)}
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
            isLoading={isLoading}
          />
          <StatCard
            icon={Star}
            label={t('calendarModule.stats.active')}
            value={formatNumber(stats.active)}
            accent="text-[rgb(var(--state-warning-fg))]"
            bg="bg-[rgb(var(--state-warning-fg))]/10"
            isLoading={isLoading}
          />
          <StatCard
            icon={Clock}
            label={t('calendarModule.stats.planning')}
            value={formatNumber(stats.planning)}
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
            isLoading={isLoading}
          />
        </div>

        {/* Content */}
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-secondary rounded-xl border border-border-secondary p-5 animate-pulse"
              >
                <div className="h-5 w-2/3 bg-surface-primary rounded mb-2" />
                <div className="h-4 w-1/2 bg-surface-primary rounded mb-4" />
                <div className="flex gap-2 pt-3 border-t border-border-secondary mt-3">
                  <div className="h-6 w-16 bg-surface-primary rounded-full" />
                  <div className="h-6 w-16 bg-surface-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !academicYears || academicYears.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {academicYears.map((year) => (
              <AcademicYearCard
                key={year.yearId}
                year={year}
                onSetCurrent={handleSetCurrent}
                onAdvanceStatus={handleAdvanceStatus}
                isSettingCurrent={
                  setCurrentMutation.isPending &&
                  setCurrentMutation.variables?.yearId === year.yearId
                }
                isUpdatingStatus={
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.yearId === year.yearId
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Set Current Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmSetCurrent}
        onClose={() => setConfirmSetCurrent(null)}
        onConfirm={handleConfirmSetCurrent}
        title={t('calendarModule.confirm.setCurrentTitle')}
        description={
          confirmSetCurrent
            ? currentYear && currentYear.yearId !== confirmSetCurrent.yearId
              ? t('calendarModule.confirm.replaceCurrentDescription', {
                  currentName: currentYear.name,
                  nextName: confirmSetCurrent.name,
                })
              : t('calendarModule.confirm.setCurrentDescription', {
                  yearName: confirmSetCurrent.name,
                })
            : ''
        }
        confirmText={t('calendarModule.actions.setCurrent')}
        cancelText={t('calendarModule.actions.cancel')}
        variant="default"
        isLoading={setCurrentMutation.isPending}
        icon={
          <Star className="w-5 h-5 text-[rgb(var(--state-success-fg))]" />
        }
      />

      {/* Advance Status Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAdvanceStatus}
        onClose={() => setConfirmAdvanceStatus(null)}
        onConfirm={handleConfirmAdvanceStatus}
        title={
          confirmAdvanceStatus
            ? t('calendarModule.confirm.advanceTitle', {
                action: t(actionLabelKey(confirmAdvanceStatus.status)),
              })
            : t('calendarModule.confirm.updateStatusTitle')
        }
        description={
          confirmAdvanceStatus
            ? t('calendarModule.confirm.advanceDescription', {
                yearName: confirmAdvanceStatus.name,
                fromStatus: t(statusLabelKey(confirmAdvanceStatus.status)).toLowerCase(),
                toStatus: NEXT_STATUS[confirmAdvanceStatus.status]
                  ? t(statusLabelKey(NEXT_STATUS[confirmAdvanceStatus.status]!)).toLowerCase()
                  : '',
              })
            : ''
        }
        confirmText={
          confirmAdvanceStatus
            ? t(actionLabelKey(confirmAdvanceStatus.status))
            : t('calendarModule.actions.confirm')
        }
        cancelText={t('calendarModule.actions.cancel')}
        variant={
          confirmAdvanceStatus?.status === 'completed' ? 'destructive' : 'default'
        }
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  )
}

export default CalendarModule
