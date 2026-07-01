/**
 * Grade Overview — V2 Redesign
 *
 * School-wide grade analytics dashboard with EdForge V2 design tokens.
 * All cards use V2 card chrome, inline SVG charts, and proper color system.
 *
 * Sections (top to bottom):
 *  - Grade Analytics sub-header
 *  - KPI row (4 StatCards from @edforge/ui)
 *  - Two-col: Grading Completion donut + Assessment Performance gauges
 *  - Full-width: Grade Distribution bar chart
 *  - Two-col: Category Performance + Course Performance
 *  - Full-width: At-Risk Students with avatar chips
 *
 * Data source: single useGradeOverview aggregate endpoint.
 *
 * Presentation: static type/spacing/color live in Tailwind classes (semantic
 * tokens + the text-2xs/3xs/4xs micro-scale). Genuinely per-datum colors and
 * chart geometry stay inline, marked `allow-presentation-style`. Off-scale
 * fixed pixel widths/heights stay inline; off-scale padding is snapped to the
 * 4px scale.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Download,
  Users,
  MoreHorizontal,
} from 'lucide-react'
import { useResourcePermissions } from '@edforge/abac'
import { StatCard, WidgetErrorBoundaryV2 } from '@edforge/ui'
import { useGradeOverview } from '../../hooks/useGrades'
import { useAcademicsI18n } from '../../lib/i18n'
import { getStudentGradient } from '../../utils/student-gradient'
import type { GradeOverviewResponse } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface PolicyWeight {
  categoryId: string
  categoryName: string
  weight: number
}

interface GradeOverviewProps {
  schoolId: string
  academicYearId: string
  policyWeights?: PolicyWeight[]
}

type AtRiskStudent = GradeOverviewResponse['atRiskStudents'][number]

// ============================================================================
// V2 DESIGN TOKENS (inline)
// ============================================================================

// Neutral members route through canonical semantic tokens (theme-aware, and
// the former rgba(255,255,255,0.0x) separators that washed out to invisible on
// the light theme are now real border tokens). Vivid brand accents stay as
// literals for SVG stroke/fill and per-datum chart/legend colors.
const V2 = {
  bgSurface: 'rgb(var(--background-secondary))',
  borderDefault: 'rgb(var(--border-primary) / 0.35)',
  borderSeparator: 'rgb(var(--border-primary) / 0.3)',
  borderRow: 'rgb(var(--border-primary) / 0.15)',
  textPrimary: 'rgb(var(--text-primary))',
  textSecondary: 'rgb(var(--text-secondary))',
  textMuted: 'rgb(var(--text-tertiary))',
  textHint: 'rgb(var(--text-tertiary))',
  textGhost: 'rgb(var(--text-disabled))',
  success: '#1D9E75',
  info: '#378ADD',
  warning: '#EF9F27',
  danger: '#E24B4A',
  purple: '#7F77DD',
  orange: '#D85A30',
}

// Shared card chrome as class strings (semantic tokens) — de-dupes the former
// cardStyle/cardHeaderStyle/cardBodyStyle inline objects.
const CARD =
  'bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)] rounded-[10px] overflow-hidden'
const CARD_HEADER =
  'px-4 py-3 border-b border-[rgb(var(--border-primary)/0.3)] flex items-center justify-between'
const CARD_BODY = 'p-4'

// ============================================================================
// V2 GRADE COLOR HELPER (inline hex, not Tailwind)
// ============================================================================

function getGradeColorHex(pct: number): string {
  if (pct >= 80) return V2.success
  if (pct >= 70) return V2.info
  if (pct >= 60) return V2.warning
  return V2.danger
}

function getPassColorHex(pct: number): string {
  if (pct >= 100) return V2.success
  if (pct >= 80) return V2.warning
  return V2.danger
}

// ============================================================================
// V2 CARD HEADER COMPONENT
// ============================================================================

function CardHeader({
  iconBg,
  title,
  subtitle,
  right,
  icon,
}: {
  iconBg: string
  title: string
  subtitle: string
  right?: React.ReactNode
  icon: React.ReactNode
}) {
  return (
    <div className={CARD_HEADER}>
      <div className="flex items-center gap-2">
        <div
          // allow-presentation-style: per-card icon tint passed as prop + fixed 22px chip
          className="rounded-[5px] flex items-center justify-center"
          style={{ width: 22, height: 22, background: iconBg }}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</div>
          <div className="text-3xs text-[rgb(var(--text-disabled))] mt-px">{subtitle}</div>
        </div>
      </div>
      {right}
    </div>
  )
}

// ============================================================================
// V2 SVG ICON HELPERS
// ============================================================================

function CheckboxIcon({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function BookIcon({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function BarChartIcon({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function CircleArrowIcon({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 12 16 16 12" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  )
}

function WarningIcon({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({
  onExportGradebook,
  onExportAtRisk,
  gradebookDisabled,
  atRiskDisabled,
}: {
  onExportGradebook: () => void
  onExportAtRisk: () => void
  gradebookDisabled: boolean
  atRiskDisabled: boolean
}) {
  const { t } = useAcademicsI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md bg-transparent border-none text-[rgb(var(--text-tertiary))] cursor-pointer"
        aria-label={t('gradesModule.overview.actions.more')}
      >
        <MoreHorizontal style={{ width: 14, height: 14 }} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)] rounded-[10px] py-1 shadow-popover"
          style={{ width: 200 }}
        >
          <button
            type="button"
            onClick={() => { onExportGradebook(); setOpen(false) }}
            disabled={gradebookDisabled}
            className="flex items-center gap-2 w-full py-2 px-3.5 text-2xs text-[rgb(var(--text-tertiary))] bg-transparent border-none"
            style={{
              cursor: gradebookDisabled ? 'not-allowed' : 'pointer',
              opacity: gradebookDisabled ? 0.4 : 1,
            }}
          >
            <Download style={{ width: 12, height: 12 }} />
            {t('gradesModule.overview.actions.exportGradebookCsv')}
          </button>
          <button
            type="button"
            onClick={() => { onExportAtRisk(); setOpen(false) }}
            disabled={atRiskDisabled}
            className="flex items-center gap-2 w-full py-2 px-3.5 text-2xs text-[rgb(var(--text-tertiary))] bg-transparent border-none"
            style={{
              cursor: atRiskDisabled ? 'not-allowed' : 'pointer',
              opacity: atRiskDisabled ? 0.4 : 1,
            }}
          >
            <Download style={{ width: 12, height: 12 }} />
            {t('gradesModule.overview.actions.exportAtRiskCsv')}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CSV EXPORT
// ============================================================================

function exportAtRiskCsv(students: AtRiskStudent[], schoolId: string) {
  const header = 'Student Name,Course,Numeric Grade,Letter Grade\n'
  const rows = students
    .map((s) => `"${s.studentName}","${s.courseName}",${s.numericGrade.toFixed(1)},${s.letterGrade ?? ''}`)
    .join('\n')
  downloadCsv(header + rows, `at-risk-students-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`)
}

function exportFullGradebookCsv(data: GradeOverviewResponse, schoolId: string) {
  const header = 'Course,Students,Avg Grade,Avg GPA,Pass Rate\n'
  const rows = data.coursePerformance
    .map((c) => `"${c.courseName}",${c.studentCount},${c.avgGrade.toFixed(1)}%,${c.avgGpa.toFixed(2)},${c.passRate.toFixed(1)}%`)
    .join('\n')
  downloadCsv(header + rows, `gradebook-overview-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`)
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// V2 DISTRIBUTION BAR COLORS
// ============================================================================

const DIST_COLORS: Record<string, string> = {
  A: V2.success,
  B: V2.info,
  C: V2.warning,
  D: 'rgb(var(--text-disabled))', // neutral grey; the former white@15% washed out on the light theme
  F: V2.danger,
}

// ============================================================================
// CATEGORY BAR COLORS (cycle by index)
// ============================================================================

const CATEGORY_COLORS = [V2.success, V2.info, V2.purple, V2.warning, V2.orange]

// ============================================================================
// STUDENT INITIALS HELPER
// ============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GradeOverview({
  schoolId,
  academicYearId,
  policyWeights,
}: GradeOverviewProps) {
  const { t, formatNumber, formatCount } = useAcademicsI18n()
  const gradePerms = useResourcePermissions('grades')
  const { data, isLoading, isError } = useGradeOverview(schoolId, academicYearId)

  const handleExportAtRisk = useCallback(() => {
    if (data?.atRiskStudents && data.atRiskStudents.length > 0) {
      exportAtRiskCsv(data.atRiskStudents, schoolId)
    }
  }, [data, schoolId])

  const handleExportGradebook = useCallback(() => {
    if (data && data.coursePerformance.length > 0) {
      exportFullGradebookCsv(data, schoolId)
    }
  }, [data, schoolId])

  // Grade distribution with letter keys for color lookup
  const distBars = useMemo(() => {
    if (!data?.gradeDistribution) return []
    const letters = ['A', 'B', 'C', 'D', 'F']
    const maxCount = Math.max(...data.gradeDistribution.map((d) => d.count), 1)
    return data.gradeDistribution.map((d, i) => ({
      letter: letters[i] || 'F',
      count: d.count,
      heightPct: maxCount > 0 ? Math.max((d.count / maxCount) * 100, 2) : 2,
    }))
  }, [data])

  // Sorted course performance
  const [courseSortKey, setCourseSortKey] = useState<'avgGrade' | 'courseName' | 'passRate'>('avgGrade')
  const [courseSortDir, setCourseSortDir] = useState<'asc' | 'desc'>('desc')
  const sortedCourses = useMemo(() => {
    if (!data?.coursePerformance) return []
    return [...data.coursePerformance].sort((a, b) => {
      const aVal = courseSortKey === 'courseName' ? a.courseName.toLowerCase() : a[courseSortKey]
      const bVal = courseSortKey === 'courseName' ? b.courseName.toLowerCase() : b[courseSortKey]
      if (aVal < bVal) return courseSortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return courseSortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data?.coursePerformance, courseSortKey, courseSortDir])

  if (isError) {
    return (
      <div className="rounded-[10px] border border-[rgb(var(--state-danger-border))] bg-[rgb(var(--state-danger-bg))] p-6 text-xs text-center text-[rgb(var(--state-danger-fg))]">
        {t('gradesModule.overview.error')}
      </div>
    )
  }

  if (isLoading) {
    return (
      <WidgetErrorBoundaryV2 fallbackMessage={t('gradesModule.overview.errorStats')}>
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} label="" value="" icon={Users} accentColor="rgba(55,138,221,0.10)" iconColor={V2.info} barColor={V2.info} loading />
          ))}
        </div>
      </WidgetErrorBoundaryV2>
    )
  }

  if (!data || data.totalStudentsGraded === 0) {
    return (
      <div className="p-12 text-center">
        <GraduationCap className="text-[rgb(var(--text-tertiary))] mx-auto mb-3" style={{ width: 40, height: 40 }} />
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {t('gradesModule.overview.empty')}
        </p>
      </div>
    )
  }

  const completionRate = data.gradingProgress?.completionRate ?? 0
  const gradedEntries = data.gradingProgress?.gradedEntries ?? 0
  const ungradedStubs = data.gradingProgress?.ungradedStubs ?? 0
  const totalEntries = data.gradingProgress?.totalAssignmentEntries ?? 0

  // SVG donut math for grading completion (80px, r=30, strokeWidth=10)
  const donutR = 30
  const donutC = 2 * Math.PI * donutR // ~188.5
  const donutOffset = donutC * (1 - completionRate / 100)

  // Assessment gauge math (68px, r=26, strokeWidth=8)
  const gaugeR = 26
  const gaugeC = 2 * Math.PI * gaugeR // ~163.4
  const formScore = data.assessmentBreakdown?.formative?.avgScore ?? 0
  const summScore = data.assessmentBreakdown?.summative?.avgScore ?? 0
  const formOffset = gaugeC * (1 - formScore / 100)
  const summOffset = gaugeC * (1 - summScore / 100)
  const scoreDiff = Math.abs(formScore - summScore).toFixed(1)
  const gradeDistributionLabels: Record<string, string> = {
    A: t('gradesModule.overview.distribution.a'),
    B: t('gradesModule.overview.distribution.b'),
    C: t('gradesModule.overview.distribution.c'),
    D: t('gradesModule.overview.distribution.d'),
    F: t('gradesModule.overview.distribution.f'),
  }
  const courseHeaders = [
    t('gradesModule.overview.courseHeaders.course'),
    t('gradesModule.overview.courseHeaders.sections'),
    t('gradesModule.overview.courseHeaders.students'),
    t('gradesModule.overview.courseHeaders.avgGrade'),
    t('gradesModule.overview.courseHeaders.gpa'),
    t('gradesModule.overview.courseHeaders.passRate'),
  ]

  return (
    <div>
      {/* ---- GRADE ANALYTICS SUB-HEADER ---- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            // allow-presentation-style: section icon chip tint + fixed 22px chip
            className="rounded-[5px] flex items-center justify-center"
            style={{ width: 22, height: 22, background: 'rgba(55,138,221,0.10)' }}
          >
            <BookIcon color={V2.info} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[rgb(var(--text-primary))]">
              {t('gradesModule.overview.title')}
            </div>
            <div className="text-3xs text-[rgb(var(--text-disabled))]">
              {t('gradesModule.overview.subtitle')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xs text-[rgb(var(--text-tertiary))]">
            {t('gradesModule.overview.sectionsGraded', {
              graded: formatNumber(data.sectionsWithGrades),
              total: formatNumber(data.totalSections),
            })}
          </span>
          {gradePerms.view && (
            <ActionsDropdown
              onExportGradebook={handleExportGradebook}
              onExportAtRisk={handleExportAtRisk}
              gradebookDisabled={!data.coursePerformance?.length}
              atRiskDisabled={!data.atRiskStudents?.length}
            />
          )}
        </div>
      </div>

      {/* ---- KPI ROW (CLS-005) ---- */}
      <WidgetErrorBoundaryV2 fallbackMessage={t('gradesModule.overview.errorStats')}>
        <div className="grid grid-cols-4 gap-2.5 mb-3.5">
          <StatCard
            label={t('gradesModule.overview.kpis.studentsGraded')}
            value={formatNumber(data.totalStudentsGraded)}
            icon={Users}
            signature="students"
            accentColor="rgba(55,138,221,0.10)"
            iconColor={V2.info}
            barColor={V2.info}
            hint={t('gradesModule.overview.sectionsGraded', {
              graded: formatNumber(data.sectionsWithGrades),
              total: formatNumber(data.totalSections),
            })}
          />
          <StatCard
            label={t('gradesModule.overview.kpis.averageGpa')}
            value={data.averageGpa.toFixed(2)}
            icon={Users}
            signature="gpa"
            accentColor="rgba(29,158,117,0.10)"
            iconColor={V2.success}
            barColor={V2.success}
            hint={t('gradesModule.overview.kpis.avgGradeHint', {
              grade: data.averageGrade.toFixed(1),
            })}
          />
          <StatCard
            label={t('gradesModule.overview.kpis.passRate')}
            value={`${data.passRate.toFixed(1)}%`}
            icon={CheckCircle}
            accentColor="rgba(29,158,117,0.10)"
            iconColor={V2.success}
            barColor={V2.success}
            hint={t('gradesModule.overview.kpis.passRateHint')}
          />
          <StatCard
            label={t('gradesModule.overview.kpis.atRisk')}
            value={formatNumber(data.atRiskCount)}
            icon={AlertTriangle}
            signature="atrisk"
            accentColor="rgba(226,75,74,0.10)"
            iconColor={V2.danger}
            barColor={V2.danger}
            hint={t('gradesModule.overview.kpis.atRiskHint')}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* ---- ROW 1: Grading Completion + Assessment Performance (CLS-006, CLS-007) ---- */}
      <div className="grid grid-cols-2 gap-3 mb-3">

        {/* Grading Completion */}
        <div className={CARD}>
          <CardHeader
            iconBg="rgba(127,119,221,0.10)"
            title={t('gradesModule.overview.completion.title')}
            subtitle={t('gradesModule.overview.completion.subtitle')}
            icon={<CheckboxIcon color={V2.purple} />}
          />
          <div className={CARD_BODY}>
            <div className="flex items-center gap-5">
              {/* SVG Donut */}
              <div className="relative shrink-0">
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={donutR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
                  <circle
                    cx={40} cy={40} r={donutR} fill="none"
                    stroke={V2.purple} strokeWidth={10}
                    strokeDasharray={donutC} strokeDashoffset={donutOffset}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg font-bold leading-none text-[rgb(var(--text-primary))]">{completionRate.toFixed(0)}%</span>
                  <span className="text-4xs text-[rgb(var(--text-tertiary))] mt-0.5">
                    {t('gradesModule.overview.completion.gradedShort')}
                  </span>
                </div>
              </div>
              {/* Stats */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-2xs text-[rgb(var(--text-tertiary))]">
                    <span className="w-2 h-2 rounded-full bg-[#7F77DD]" />
                    {t('gradesModule.overview.completion.graded')}
                  </span>
                  <span className="text-xs font-semibold text-[rgb(var(--text-primary))]">
                    {formatNumber(gradedEntries)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-2xs text-[rgb(var(--text-tertiary))]">
                    <span className="w-2 h-2 rounded-full bg-[rgb(var(--text-disabled))]" />
                    {t('gradesModule.overview.completion.remaining')}
                  </span>
                  <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))]">
                    {formatNumber(ungradedStubs)}
                  </span>
                </div>
                <div className="text-3xs text-[rgb(var(--text-disabled))] mt-1 pt-2" style={{ borderTop: `1px solid ${V2.borderSeparator}` }}>
                  {t('gradesModule.overview.completion.totalEntries', {
                    total: formatNumber(totalEntries),
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Performance */}
        <div className={CARD}>
          <CardHeader
            iconBg="rgba(55,138,221,0.10)"
            title={t('gradesModule.overview.assessment.title')}
            subtitle={t('gradesModule.overview.assessment.subtitle')}
            icon={<BookIcon color={V2.info} />}
          />
          <div className={CARD_BODY}>
            <div className="flex items-center gap-4">
              {/* Formative gauge */}
              <div className="shrink-0 text-center">
                <div className="relative">
                  <svg width={68} height={68} viewBox="0 0 68 68">
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke={V2.success} strokeWidth={8}
                      strokeDasharray={gaugeC} strokeDashoffset={formOffset}
                      strokeLinecap="round" transform="rotate(-90 34 34)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold text-[#1D9E75]">{formScore.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-2xs font-semibold text-[rgb(var(--text-secondary))] mt-1">
                  {t('gradesModule.management.purposes.formative')}
                </div>
                <div className="text-4xs text-[rgb(var(--text-disabled))]">
                  {t('gradesModule.overview.assessment.formativeExamples')}
                </div>
              </div>

              <div
                // allow-presentation-style: fixed 50px vertical divider
                className="w-px bg-[rgb(var(--border-primary)/0.3)]"
                style={{ height: 50 }}
              />

              {/* Summative gauge */}
              <div className="shrink-0 text-center">
                <div className="relative">
                  <svg width={68} height={68} viewBox="0 0 68 68">
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke={V2.info} strokeWidth={8}
                      strokeDasharray={gaugeC} strokeDashoffset={summOffset}
                      strokeLinecap="round" transform="rotate(-90 34 34)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      // allow-presentation-style: summative accent (info hex, not a brand-class literal)
                      className="text-base font-bold"
                      style={{ color: V2.info }}
                    >{summScore.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-2xs font-semibold text-[rgb(var(--text-secondary))] mt-1">
                  {t('gradesModule.management.purposes.summative')}
                </div>
                <div className="text-4xs text-[rgb(var(--text-disabled))]">
                  {t('gradesModule.overview.assessment.summativeExamples')}
                </div>
              </div>

              <div
                // allow-presentation-style: fixed 50px vertical divider
                className="w-px bg-[rgb(var(--border-primary)/0.3)]"
                style={{ height: 50 }}
              />

              {/* Insight */}
              <div className="flex-1">
                <div className="text-3xs text-[rgb(var(--text-tertiary))] leading-normal">
                  {formScore > summScore ? (
                    <>
                      <em className="not-italic text-[#1D9E75]">
                        {t('gradesModule.overview.assessment.formativeHigher', { diff: scoreDiff })}
                      </em>{' '}
                      {t('gradesModule.overview.assessment.higherSuffix')}
                    </>
                  ) : summScore > formScore ? (
                    <>
                      <em
                        // allow-presentation-style: summative accent (info hex, not a brand-class literal)
                        className="not-italic"
                        style={{ color: V2.info }}
                      >
                        {t('gradesModule.overview.assessment.summativeHigher', { diff: scoreDiff })}
                      </em>{' '}
                      {t('gradesModule.overview.assessment.summativeHigherSuffix')}
                    </>
                  ) : (
                    <>{t('gradesModule.overview.assessment.equal')}</>
                  )}
                </div>
                {data.assessmentBreakdown?.unclassified && data.assessmentBreakdown.unclassified.count > 0 && (
                  <div className="text-4xs text-[rgb(var(--text-disabled))] mt-2">
                    {t('gradesModule.overview.assessment.unclassified', {
                      count: data.assessmentBreakdown.unclassified.count,
                      value: formatNumber(data.assessmentBreakdown.unclassified.count),
                      avg: data.assessmentBreakdown.unclassified.avgScore.toFixed(1),
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- ROW 2: Grade Distribution (CLS-008) ---- */}
      <div className="mb-3">
        <div className={CARD}>
          <CardHeader
            iconBg="rgba(239,159,39,0.10)"
            title={t('gradesModule.overview.distribution.title')}
            subtitle={t('gradesModule.overview.distribution.subtitle')}
            icon={<BarChartIcon color={V2.warning} />}
          />
          <div className={CARD_BODY}>
            <div className="flex items-end gap-2 pt-4" style={{ height: 110 }}>
              {distBars.map((bar) => {
                const barColor = DIST_COLORS[bar.letter] || V2.textGhost
                const labelColor = bar.letter === 'D' ? V2.textGhost : barColor
                return (
                  <div key={bar.letter} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span
                      // allow-presentation-style: per-grade-band label color
                      className="text-2xs font-bold mb-1"
                      style={{ color: labelColor }}
                    >{formatNumber(bar.count)}</span>
                    <div
                      // allow-presentation-style: data-driven bar height + per-band fill color
                      className="w-full rounded-t"
                      style={{ background: barColor, height: `${bar.heightPct}%`, minHeight: 2 }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 pt-2 mt-3" style={{ borderTop: `1px solid ${V2.borderSeparator}` }}>
              {distBars.map((bar) => (
                <div key={bar.letter} className="flex-1 text-center text-4xs text-[rgb(var(--text-disabled))]">
                  {gradeDistributionLabels[bar.letter]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- ROW 3: Category Performance + Course Performance (CLS-009, CLS-010) ---- */}
      <div className="grid grid-cols-2 gap-3 mb-3">

        {/* Category Performance */}
        {data.categoryPerformance && data.categoryPerformance.length > 0 && (
          <div className={CARD}>
            <CardHeader
              iconBg="rgba(29,158,117,0.10)"
              title={t('gradesModule.overview.category.title')}
              subtitle={t('gradesModule.overview.category.subtitle')}
              icon={<CircleArrowIcon color={V2.success} />}
            />
            <div className={CARD_BODY}>
              {/* Column headers */}
              <div className="flex items-center gap-3 mb-1.5 pb-1.5" style={{ borderBottom: `1px solid ${V2.borderSeparator}` }}>
                <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px]" style={{ width: 110 }}>{t('gradesModule.overview.category.headers.category')}</span>
                <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-center" style={{ width: 36 }}>{t('gradesModule.overview.category.headers.weight')}</span>
                <span className="flex-1 text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px]">{t('gradesModule.overview.category.headers.score')}</span>
                <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-right" style={{ width: 50 }}>#</span>
                <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-right" style={{ width: 50 }}>{t('gradesModule.overview.category.headers.avg')}</span>
              </div>
              {data.categoryPerformance.map((cat, idx) => {
                const barColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                const matchedWeight = policyWeights?.find((w) => w.categoryId === cat.categoryId)
                const catName = matchedWeight?.categoryName || cat.categoryName.charAt(0).toUpperCase() + cat.categoryName.slice(1)
                const weight = matchedWeight ? `${matchedWeight.weight}%` : '—'
                return (
                  <div
                    key={cat.categoryId}
                    className="flex items-center py-2 gap-3"
                    style={{ borderBottom: `1px solid ${V2.borderRow}` }}
                  >
                    <span className="text-xs font-medium text-[rgb(var(--text-primary))] shrink-0" style={{ width: 110 }}>{catName}</span>
                    <span className="text-3xs text-[rgb(var(--text-tertiary))] shrink-0 text-center" style={{ width: 36 }}>{weight}</span>
                    <div className="flex-1 h-1 rounded-[2px] overflow-hidden bg-[rgb(var(--background-tertiary))]">
                      <div
                        // allow-presentation-style: data-driven category bar width + color
                        className="h-full rounded-[2px]"
                        style={{ background: barColor, width: `${cat.avgScore}%` }}
                      />
                    </div>
                    <span className="text-3xs text-[rgb(var(--text-tertiary))] text-right shrink-0" style={{ width: 50 }}>{formatNumber(cat.assignmentCount)}</span>
                    <span
                      // allow-presentation-style: category avg score color matches its bar
                      className="text-xs font-semibold text-right shrink-0"
                      style={{ width: 50, color: barColor }}
                    >{cat.avgScore.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Course Performance */}
        {data.coursePerformance.length > 0 && (
          <div className={CARD}>
            <CardHeader
              iconBg="rgba(55,138,221,0.10)"
              title={t('gradesModule.overview.course.title')}
              subtitle={t('gradesModule.overview.course.subtitle')}
              icon={<BookIcon color={V2.info} />}
            />
            <div className={CARD_BODY}>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {courseHeaders.map((h, i) => (
                      <th
                        key={h}
                        className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] pb-2"
                        style={{
                          textAlign: i === 0 ? 'left' : 'right',
                          cursor: ['courseName', '', '', 'avgGrade', '', 'passRate'][i] ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          const key = ['courseName', '', '', 'avgGrade', '', 'passRate'][i] as 'avgGrade' | 'courseName' | 'passRate'
                          if (!key) return
                          if (courseSortKey === key) setCourseSortDir((d) => d === 'desc' ? 'asc' : 'desc')
                          else { setCourseSortKey(key); setCourseSortDir('desc') }
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map((course) => (
                    <tr key={course.courseId}>
                      <td className="py-2.5 text-xs font-medium text-[rgb(var(--text-primary))]" style={{ borderBottom: `1px solid ${V2.borderRow}` }}>{course.courseName}</td>
                      <td className="py-2.5 text-right text-2xs text-[rgb(var(--text-tertiary))]" style={{ borderBottom: `1px solid ${V2.borderRow}` }}>{formatNumber(course.sectionCount)}</td>
                      <td className="py-2.5 text-right text-2xs text-[rgb(var(--text-tertiary))]" style={{ borderBottom: `1px solid ${V2.borderRow}` }}>{formatNumber(course.studentCount)}</td>
                      <td
                        // allow-presentation-style: grade-band severity color
                        className="py-2.5 text-right text-xs font-semibold"
                        style={{ borderBottom: `1px solid ${V2.borderRow}`, color: getGradeColorHex(course.avgGrade) }}
                      >
                        {course.avgGrade.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-right text-2xs text-[rgb(var(--text-tertiary))]" style={{ borderBottom: `1px solid ${V2.borderRow}` }}>{course.avgGpa.toFixed(2)}</td>
                      <td
                        // allow-presentation-style: pass-rate severity color
                        className="py-2.5 text-right text-xs font-semibold"
                        style={{ borderBottom: `1px solid ${V2.borderRow}`, color: getPassColorHex(course.passRate) }}
                      >
                        {course.passRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ---- ROW 4: At-Risk Students (CLS-011) ---- */}
      <div className="mb-3">
        <div className={CARD}>
          <CardHeader
            iconBg="rgba(226,75,74,0.10)"
            title={t('gradesModule.overview.atRisk.title')}
            subtitle={t('gradesModule.overview.atRisk.subtitle')}
            right={
              data.atRiskStudents.length > 0 ? (
                <span className="text-3xs text-[rgb(var(--text-tertiary))]">
                  {formatCount('gradesModule.overview.atRisk.studentCount', data.atRiskStudents.length)}
                </span>
              ) : undefined
            }
            icon={<WarningIcon color={V2.danger} />}
          />
          <div className={CARD_BODY}>
            {data.atRiskStudents.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="text-[#1D9E75] mx-auto mb-3" style={{ width: 40, height: 40 }} />
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('gradesModule.overview.atRisk.empty')}
                </p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div className="flex items-center gap-3 mb-1.5 pb-1.5" style={{ borderBottom: `1px solid ${V2.borderSeparator}` }}>
                  <span className="flex-1 text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px]">{t('gradesModule.overview.atRisk.headers.student')}</span>
                  <span className="flex-1 text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px]">{t('gradesModule.overview.atRisk.headers.course')}</span>
                  <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-right" style={{ width: 80 }}>{t('gradesModule.overview.atRisk.headers.grade')}</span>
                  <span className="text-4xs font-bold text-[rgb(var(--text-disabled))] uppercase tracking-[0.5px] text-right" style={{ width: 50 }}>{t('gradesModule.overview.atRisk.headers.letter')}</span>
                </div>
                {data.atRiskStudents.map((student, i) => {
                  const gradeColor = student.numericGrade < 60 ? V2.danger : V2.warning
                  const letterBg = student.numericGrade < 60 ? 'rgba(226,75,74,0.10)' : 'rgba(239,159,39,0.10)'
                  const letterColor = student.numericGrade < 60 ? V2.danger : V2.warning
                  return (
                    <div
                      key={`${student.studentId}-${student.courseId}-${i}`}
                      className="flex items-center py-2 gap-3"
                      style={{ borderBottom: `1px solid ${V2.borderRow}` }}
                    >
                      {/* Avatar chip */}
                      <div className="flex items-center gap-2.5 flex-1">
                        <div
                          // allow-presentation-style: per-student avatar gradient + white text on it
                          className="rounded-full flex items-center justify-center shrink-0 text-3xs font-bold"
                          style={{
                            width: 28,
                            height: 28,
                            background: getStudentGradient(student.studentName),
                            color: 'white',
                          }}
                        >
                          {getInitials(student.studentName)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-[rgb(var(--text-primary))]">{student.studentName}</div>
                        </div>
                      </div>
                      <div className="flex-1 text-3xs text-[rgb(var(--text-tertiary))]">{student.courseName}</div>
                      <span
                        // allow-presentation-style: at-risk grade severity color
                        className="text-xs font-bold text-right"
                        style={{ width: 80, color: gradeColor }}
                      >
                        {student.numericGrade.toFixed(1)}%
                      </span>
                      <span
                        // allow-presentation-style: letter-grade chip tint (danger/warning)
                        className="text-4xs font-semibold py-px px-1.5 rounded text-center"
                        style={{ width: 50, background: letterBg, color: letterColor }}
                      >
                        {student.letterGrade}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradeOverview
