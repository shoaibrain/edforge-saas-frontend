/**
 * ClassroomOverview — Overview tab for the classroom detail page.
 *
 * Replaces the old "Stream" tab. Shows section info, quick action buttons,
 * and summary widgets for grades, attendance, and recent classwork using
 * the same data hooks already available in the app.
 */

import { useMemo } from 'react'
import {
  ClipboardCheck,
  BookCheck,
  Users,
  GraduationCap,
  FileText,
  ClipboardList,
  HelpCircle,
  MessageCircle,
  Calendar,
  MapPin,
  BookOpen,
  User,
} from 'lucide-react'
import { useSectionRoster } from '../../../hooks/useSections'
import { useSectionGrades } from '../../../hooks/useGrades'
import { useSectionAttendanceRecords } from '../../../hooks/useSectionAttendance'
import { useClassworkItems } from '../../../hooks/useClasswork'
import { useActiveSchoolId } from '../../../stores/app.store'
import { getCapacityPercent } from '../../../schemas/section.form'
import type { ClassworkItemResponseDto } from '@aibrains/shared-types'
import { useAcademicsI18n } from '../../../lib/i18n'

interface ClassroomOverviewProps {
  sectionId: string
  section: {
    sectionId: string
    courseName?: string
    courseCode?: string
    primaryTeacherName?: string
    roomNumber?: string
    locationRoomNumber?: string
    currentEnrollment: number
    maxEnrollment: number
    isActive: boolean
    courseId?: string
    periodName?: string
    sectionNumber: string
    sectionName?: string
  }
  onNavigateTab: (tab: string) => void
}

// ── Quick Actions ──────────────────────────────────────────────────────────

function QuickActions({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const { t } = useAcademicsI18n()
  const actions = [
    { label: t('classrooms.actions.takeAttendance'), icon: ClipboardCheck, tab: 'progress:attendance' },
    { label: t('classrooms.actions.openGradebook'), icon: BookCheck, tab: 'progress:gradebook' },
    { label: t('classrooms.tabs.classwork'), icon: BookOpen, tab: 'classwork' },
    { label: t('classrooms.actions.viewRoster'), icon: Users, tab: 'people' },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((a) => (
        <button
          key={a.tab}
          type="button"
          onClick={() => onNavigateTab(a.tab)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
        >
          <a.icon className="w-3.5 h-3.5" />
          {a.label}
        </button>
      ))}
    </div>
  )
}

// ── Section Info Card ──────────────────────────────────────────────────────

function SectionInfoCard({ section }: { section: ClassroomOverviewProps['section'] }) {
  const { t, formatNumber } = useAcademicsI18n()
  const percent = getCapacityPercent(section.currentEnrollment, section.maxEnrollment)
  const capacityColor =
    percent < 15 ? 'bg-[rgb(var(--state-danger-fg))]' : percent < 33 ? 'bg-[rgb(var(--state-warning-fg))]' : 'bg-[rgb(var(--state-info-fg))]'

  const details = [
    { icon: BookOpen, label: t('classrooms.detail.course'), value: `${section.courseName || t('classrooms.detail.notAvailable')}${section.courseCode ? ` (${section.courseCode})` : ''}` },
    { icon: User, label: t('classrooms.detail.teacher'), value: section.primaryTeacherName || t('classrooms.detail.notAssigned') },
    section.locationRoomNumber || section.roomNumber
      ? { icon: MapPin, label: t('classrooms.detail.room'), value: section.locationRoomNumber || section.roomNumber }
      : null,
    section.periodName
      ? { icon: Calendar, label: t('classrooms.detail.period'), value: section.periodName }
      : null,
  ].filter(Boolean) as { icon: typeof BookOpen; label: string; value: string }[]

  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {details.map((d) => (
          <div key={d.label} className="flex items-start gap-2">
            <d.icon className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">{d.label}</p>
              <p className="text-sm text-text-primary truncate">{d.value}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Enrollment bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden">
          <div
            className={`h-full rounded-full ${capacityColor} transition-all`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <span className="text-xs text-text-secondary whitespace-nowrap">
          {t('classrooms.detail.enrolledWithCapacity', {
            current: formatNumber(section.currentEnrollment),
            max: formatNumber(section.maxEnrollment),
            percent: formatNumber(percent),
          })}
        </span>
      </div>
    </div>
  )
}

// ── Grade Summary Widget ───────────────────────────────────────────────────

const distColors: Record<string, string> = {
  A: 'bg-[rgb(var(--state-success-fg))]',
  B: 'bg-[rgb(var(--state-info-fg))]',
  C: 'bg-[rgb(var(--state-warning-fg))]',
  D: 'bg-[rgb(var(--state-warning-fg))]',
  F: 'bg-[rgb(var(--state-danger-fg))]',
}

function GradeSummaryWidget({
  sectionId,
  onNavigateTab,
}: {
  sectionId: string
  onNavigateTab: (tab: string) => void
}) {
  const { t, formatNumber } = useAcademicsI18n()
  const schoolId = useActiveSchoolId() || ''
  const { data: gradebook, isError } = useSectionGrades(sectionId, { schoolId }, !!schoolId)

  const stats = useMemo(() => {
    const grades = gradebook?.grades ?? []
    if (grades.length === 0) return null
    const scored = grades.filter((g) => g.numericGrade != null)
    if (scored.length === 0) return null
    const avg = scored.reduce((s, g) => s + (g.numericGrade || 0), 0) / scored.length
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    scored.forEach((g) => {
      const n = g.numericGrade || 0
      if (n >= 90) distribution.A++
      else if (n >= 80) distribution.B++
      else if (n >= 70) distribution.C++
      else if (n >= 60) distribution.D++
      else distribution.F++
    })
    return { avg: Math.round(avg * 10) / 10, total: scored.length, distribution }
  }, [gradebook])

  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{t('classrooms.overviewPanels.grades')}</h3>
        <button
          type="button"
          onClick={() => onNavigateTab('progress:gradebook')}
          className="text-xs text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] font-medium"
        >
          {t('classrooms.actions.openGradebook')} &rarr;
        </button>
      </div>
      {isError ? (
        <p className="text-xs text-[rgb(var(--state-danger-fg))]">{t('classrooms.overviewPanels.failedLoadGrades')}</p>
      ) : stats ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{formatNumber(stats.avg)}%</span>
            <span className="text-sm text-text-secondary">{t('classrooms.gradebook.classAverage')}</span>
          </div>
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-surface-secondary">
            {Object.entries(stats.distribution).map(([letter, count]) => {
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
              return pct > 0 ? (
                <div
                  key={letter}
                  className={`${distColors[letter]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${letter}: ${count}`}
                />
              ) : null
            })}
          </div>
          <div className="flex gap-4 text-xs">
            {Object.entries(stats.distribution).map(([letter, count]) => (
              <div key={letter} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${distColors[letter]}`} />
                <span className="text-text-secondary font-medium">{letter}</span>
                <span className="text-text-tertiary">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <GraduationCap className="w-8 h-8 mx-auto text-text-tertiary mb-2" aria-hidden="true" />
          <p className="text-sm text-text-secondary">{t('classrooms.empty.noGradesRecorded')}</p>
        </div>
      )}
    </div>
  )
}

// ── Attendance Summary Widget ──────────────────────────────────────────────

function AttendanceSummaryWidget({
  sectionId,
  onNavigateTab,
}: {
  sectionId: string
  onNavigateTab: (tab: string) => void
}) {
  const { t, formatNumber } = useAcademicsI18n()
  const schoolId = useActiveSchoolId() || ''
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const { data: roster } = useSectionRoster({ sectionId, schoolId, enabled: !!schoolId })
  const { data: todayRecords, isError } = useSectionAttendanceRecords({
    sectionId,
    schoolId,
    date: today,
    enabled: !!schoolId && !!sectionId,
  })

  const stats = useMemo(() => {
    const total = roster?.students?.length ?? 0
    if (total === 0) return null
    const recorded = todayRecords?.length ?? 0
    const present = todayRecords?.filter((r) => r.status === 'present').length ?? 0
    const absent = todayRecords?.filter((r) => r.status === 'absent').length ?? 0
    const late = todayRecords?.filter((r) => r.status === 'late').length ?? 0
    const remote = todayRecords?.filter((r) => r.status === 'remote').length ?? 0
    const rate = total > 0 ? ((present + late + remote) / total) * 100 : 0
    return { total, recorded, present, absent, late, remote, rate }
  }, [roster, todayRecords])

  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{t('classrooms.overviewPanels.attendance')}</h3>
        <button
          type="button"
          onClick={() => onNavigateTab('progress:attendance')}
          className="text-xs text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] font-medium"
        >
          {t('classrooms.actions.openAttendance')} &rarr;
        </button>
      </div>
      {isError ? (
        <p className="text-xs text-[rgb(var(--state-danger-fg))]">{t('classrooms.overviewPanels.failedLoadAttendance')}</p>
      ) : stats && stats.recorded > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                stats.rate >= 95
                  ? 'text-[rgb(var(--state-success-fg))]'
                  : stats.rate >= 90
                    ? 'text-[rgb(var(--state-warning-fg))]'
                    : 'text-[rgb(var(--state-danger-fg))]'
              }`}
            >
              {formatNumber(Number(stats.rate.toFixed(1)))}%
            </span>
            <span className="text-sm text-text-secondary">{t('classrooms.detail.todayRate')}</span>
          </div>
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-surface-secondary">
            {stats.present > 0 && (
              <div className="bg-[rgb(var(--state-success-fg))] transition-all" style={{ width: `${(stats.present / stats.total) * 100}%` }} title={`Present: ${stats.present}`} />
            )}
            {stats.late > 0 && (
              <div className="bg-[rgb(var(--state-warning-fg))] transition-all" style={{ width: `${(stats.late / stats.total) * 100}%` }} title={`Late: ${stats.late}`} />
            )}
            {stats.remote > 0 && (
              <div className="bg-[rgb(var(--state-info-fg))] transition-all" style={{ width: `${(stats.remote / stats.total) * 100}%` }} title={`Remote: ${stats.remote}`} />
            )}
            {stats.absent > 0 && (
              <div className="bg-[rgb(var(--state-danger-fg))] transition-all" style={{ width: `${(stats.absent / stats.total) * 100}%` }} title={`Absent: ${stats.absent}`} />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { label: t('attendance.status.present.label'), value: stats.present, dot: 'bg-[rgb(var(--state-success-fg))]' },
              { label: t('attendance.status.late.label'), value: stats.late, dot: 'bg-[rgb(var(--state-warning-fg))]' },
              { label: t('attendance.status.remote.label'), value: stats.remote, dot: 'bg-[rgb(var(--state-info-fg))]' },
              { label: t('attendance.status.absent.label'), value: stats.absent, dot: 'bg-[rgb(var(--state-danger-fg))]' },
            ]
              .filter((s) => s.value > 0)
              .map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className="text-text-secondary font-medium">{s.label}</span>
                  <span className="text-text-tertiary">{formatNumber(s.value)}</span>
                </div>
              ))}
          </div>
          <p className="text-xs text-text-tertiary">
            {t('classrooms.detail.studentsRecordedToday', {
              recorded: formatNumber(stats.recorded),
              total: formatNumber(stats.total),
            })}
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <ClipboardCheck className="w-8 h-8 mx-auto text-text-tertiary mb-2" aria-hidden="true" />
          {(roster?.students?.length ?? 0) > 0 ? (
            <>
              <p className="text-sm text-text-secondary">
                {t('classrooms.detail.studentsEnrolledCount', { count: roster?.students?.length ?? 0 })}
              </p>
              <p className="text-xs text-text-tertiary mt-1">{t('classrooms.empty.noAttendanceToday')}</p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">{t('classrooms.empty.noStudentsEnrolled')}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Recent Classwork Widget ────────────────────────────────────────────────

const classworkTypeConfig: Record<string, { icon: typeof ClipboardList; color: string; bg: string }> = {
  assignment: { icon: ClipboardList, color: 'text-[rgb(var(--state-info-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]' },
  quiz: { icon: HelpCircle, color: 'text-amber-500', bg: 'bg-[rgb(var(--state-warning-fg))]/10' },
  material: { icon: FileText, color: 'text-[rgb(var(--state-info-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]' },
  question: { icon: MessageCircle, color: 'text-[rgb(var(--state-success-fg))]', bg: 'bg-[rgb(var(--state-success-bg)/0.18)]' },
}

function RecentClassworkWidget({
  sectionId,
  onNavigateTab,
}: {
  sectionId: string
  onNavigateTab: (tab: string) => void
}) {
  const { t, formatDate, formatNumber } = useAcademicsI18n()
  const schoolId = useActiveSchoolId() || ''
  const { data: classwork, isError } = useClassworkItems(sectionId, schoolId)

  const recentItems = useMemo(() => {
    const items = classwork?.items ?? []
    return [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [classwork])

  const typeCounts = useMemo(() => {
    const items = classwork?.items ?? []
    const counts: Record<string, number> = {}
    items.forEach((item: ClassworkItemResponseDto) => {
      counts[item.type] = (counts[item.type] || 0) + 1
    })
    return counts
  }, [classwork])

  const totalItems = classwork?.items?.length ?? 0

  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{t('classrooms.overviewPanels.classwork')}</h3>
        <button
          type="button"
          onClick={() => onNavigateTab('classwork')}
          className="text-xs text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] font-medium"
        >
          {t('classrooms.actions.viewAllClasswork')} &rarr;
        </button>
      </div>
      {isError ? (
        <p className="text-xs text-[rgb(var(--state-danger-fg))]">{t('classrooms.overviewPanels.failedLoadClasswork')}</p>
      ) : totalItems > 0 ? (
        <div className="space-y-3">
          {/* Type counts */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(typeCounts).map(([type, count]) => {
              const config = classworkTypeConfig[type]
              if (!config) return null
              const Icon = config.icon
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`p-1 rounded-full ${config.bg}`}>
                    <Icon className={`w-3 h-3 ${config.color}`} />
                  </div>
                  <span className="text-text-secondary capitalize">{t('classrooms.classwork.typeCount', { type: t(`classrooms.classwork.${type}`, { defaultValue: type }) })}</span>
                  <span className="text-text-tertiary">{formatNumber(count)}</span>
                </div>
              )
            })}
          </div>
          {/* Recent items */}
          <div className="space-y-2">
            {recentItems.map((item: ClassworkItemResponseDto) => {
              const config = classworkTypeConfig[item.type] || classworkTypeConfig.assignment
              const Icon = config.icon
              const dueLabel = item.dueDate
                ? formatDate(item.dueDate, { month: 'short', day: 'numeric' })
                : null
              return (
                <div key={item.itemId} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-secondary/50">
                  <div className={`p-1.5 rounded-full ${config.bg} flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      {dueLabel && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t('classrooms.classwork.dueDateShort', { date: dueLabel })}
                        </span>
                      )}
                      {item.possiblePoints != null && <span>{t('classrooms.classwork.pointsShort', { points: formatNumber(item.possiblePoints) })}</span>}
                    </div>
                  </div>
                  {item.status === 'draft' && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-[rgb(var(--state-warning-fg))]/15 dark:text-amber-400 rounded-full">
                      {t('classrooms.classwork.draft')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto text-text-tertiary mb-2" aria-hidden="true" />
          <p className="text-sm text-text-secondary">{t('classrooms.empty.noClassworkItems')}</p>
        </div>
      )}
    </div>
  )
}

// ── Main Overview Component ────────────────────────────────────────────────

export function ClassroomOverview({ sectionId, section, onNavigateTab }: ClassroomOverviewProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quick Actions */}
      <QuickActions onNavigateTab={onNavigateTab} />

      {/* Section Info */}
      <SectionInfoCard section={section} />

      {/* Summary Widgets — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GradeSummaryWidget sectionId={sectionId} onNavigateTab={onNavigateTab} />
        <AttendanceSummaryWidget sectionId={sectionId} onNavigateTab={onNavigateTab} />
      </div>

      {/* Recent Classwork — full width */}
      <RecentClassworkWidget sectionId={sectionId} onNavigateTab={onNavigateTab} />
    </div>
  )
}
