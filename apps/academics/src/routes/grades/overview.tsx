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

const V2 = {
  bgSurface: 'rgb(var(--background-secondary))',
  borderDefault: 'rgb(var(--border-primary) / 0.35)',
  borderSeparator: 'rgba(255,255,255,0.05)',
  borderRow: 'rgba(255,255,255,0.04)',
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

const cardStyle: React.CSSProperties = {
  background: V2.bgSurface,
  border: `1px solid ${V2.borderDefault}`,
  borderRadius: 10,
  overflow: 'hidden',
}

const cardHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: `1px solid ${V2.borderSeparator}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const cardBodyStyle: React.CSSProperties = {
  padding: 16,
}

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
    <div style={cardHeaderStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: V2.textPrimary }}>{title}</div>
          <div style={{ fontSize: 10, color: V2.textGhost, marginTop: 1 }}>{subtitle}</div>
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          padding: 6,
          borderRadius: 6,
          background: 'transparent',
          border: 'none',
          color: V2.textHint,
          cursor: 'pointer',
        }}
        aria-label="More actions"
      >
        <MoreHorizontal style={{ width: 14, height: 14 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            width: 200,
            background: V2.bgSurface,
            border: `1px solid ${V2.borderDefault}`,
            borderRadius: 10,
            zIndex: 20,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <button
            type="button"
            onClick={() => { onExportGradebook(); setOpen(false) }}
            disabled={gradebookDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 14px',
              fontSize: 11,
              color: V2.textMuted,
              background: 'transparent',
              border: 'none',
              cursor: gradebookDisabled ? 'not-allowed' : 'pointer',
              opacity: gradebookDisabled ? 0.4 : 1,
            }}
          >
            <Download style={{ width: 12, height: 12 }} />
            Export Gradebook CSV
          </button>
          <button
            type="button"
            onClick={() => { onExportAtRisk(); setOpen(false) }}
            disabled={atRiskDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 14px',
              fontSize: 11,
              color: V2.textMuted,
              background: 'transparent',
              border: 'none',
              cursor: atRiskDisabled ? 'not-allowed' : 'pointer',
              opacity: atRiskDisabled ? 0.4 : 1,
            }}
          >
            <Download style={{ width: 12, height: 12 }} />
            Export At-Risk CSV
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
  D: 'rgba(255,255,255,0.15)',
  F: V2.danger,
}

const DIST_LABELS: Record<string, string> = {
  A: 'A (90\u2013100)',
  B: 'B (80\u201389)',
  C: 'C (70\u201379)',
  D: 'D (60\u201369)',
  F: 'F (0\u201359)',
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
      <div
        style={{
          borderRadius: 10,
          border: `1px solid rgba(226,75,74,0.2)`,
          background: 'rgba(226,75,74,0.06)',
          padding: 24,
          fontSize: 12,
          color: V2.danger,
          textAlign: 'center',
        }}
      >
        Failed to load grade data. Please try refreshing.
      </div>
    )
  }

  if (isLoading) {
    return (
      <WidgetErrorBoundaryV2 fallbackMessage="Failed to load grade statistics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} label="" value="" icon={Users} accentColor="rgba(55,138,221,0.10)" iconColor={V2.info} barColor={V2.info} loading />
          ))}
        </div>
      </WidgetErrorBoundaryV2>
    )
  }

  if (!data || data.totalStudentsGraded === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <GraduationCap style={{ width: 40, height: 40, margin: '0 auto 12px', color: V2.textHint }} />
        <p style={{ fontSize: 13, color: V2.textMuted }}>No grades recorded yet across sections.</p>
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

  return (
    <div>
      {/* ---- GRADE ANALYTICS SUB-HEADER ---- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(55,138,221,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookIcon color={V2.info} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: V2.textPrimary }}>Grade Analytics</div>
            <div style={{ fontSize: 10, color: V2.textGhost }}>School-wide academic performance &middot; 2025&ndash;2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: V2.textHint }}>
            {data.sectionsWithGrades} of {data.totalSections} sections graded
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
      <WidgetErrorBoundaryV2 fallbackMessage="Failed to load grade statistics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
          <StatCard
            label="STUDENTS GRADED"
            value={String(data.totalStudentsGraded)}
            icon={Users}
            accentColor="rgba(55,138,221,0.10)"
            iconColor={V2.info}
            barColor={V2.info}
            hint={`${data.sectionsWithGrades} of ${data.totalSections} sections graded`}
          />
          <StatCard
            label="AVERAGE GPA"
            value={data.averageGpa.toFixed(2)}
            icon={Users}
            accentColor="rgba(29,158,117,0.10)"
            iconColor={V2.success}
            barColor={V2.success}
            hint={`Avg grade: ${data.averageGrade.toFixed(1)}%`}
          />
          <StatCard
            label="PASS RATE"
            value={`${data.passRate.toFixed(1)}%`}
            icon={CheckCircle}
            accentColor="rgba(29,158,117,0.10)"
            iconColor={V2.success}
            barColor={V2.success}
            hint="Students scoring 60%+"
          />
          <StatCard
            label="AT RISK"
            value={String(data.atRiskCount)}
            icon={AlertTriangle}
            accentColor="rgba(226,75,74,0.10)"
            iconColor={V2.danger}
            barColor={V2.danger}
            hint="Below 60% threshold"
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* ---- ROW 1: Grading Completion + Assessment Performance (CLS-006, CLS-007) ---- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Grading Completion */}
        <div style={cardStyle}>
          <CardHeader
            iconBg="rgba(127,119,221,0.10)"
            title="Grading Completion"
            subtitle="Assignment entries across active sections"
            icon={<CheckboxIcon color={V2.purple} />}
          />
          <div style={cardBodyStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* SVG Donut */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={donutR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
                  <circle
                    cx={40} cy={40} r={donutR} fill="none"
                    stroke={V2.purple} strokeWidth={10}
                    strokeDasharray={donutC} strokeDashoffset={donutOffset}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: V2.textPrimary, lineHeight: 1 }}>{completionRate.toFixed(0)}%</span>
                  <span style={{ fontSize: 9, color: V2.textHint, marginTop: 2 }}>graded</span>
                </div>
              </div>
              {/* Stats */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: V2.textMuted }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: V2.purple }} />
                    Graded
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: V2.textPrimary }}>{gradedEntries}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: V2.textMuted }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                    Remaining
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: V2.textMuted }}>{ungradedStubs}</span>
                </div>
                <div style={{ fontSize: 10, color: V2.textGhost, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${V2.borderSeparator}` }}>
                  {totalEntries} total assignment entries
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Performance */}
        <div style={cardStyle}>
          <CardHeader
            iconBg="rgba(55,138,221,0.10)"
            title="Assessment Performance"
            subtitle="Average scores by assessment type"
            icon={<BookIcon color={V2.info} />}
          />
          <div style={cardBodyStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Formative gauge */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg width={68} height={68} viewBox="0 0 68 68">
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke={V2.success} strokeWidth={8}
                      strokeDasharray={gaugeC} strokeDashoffset={formOffset}
                      strokeLinecap="round" transform="rotate(-90 34 34)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: V2.success }}>{formScore.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: V2.textSecondary, marginTop: 4 }}>Formative</div>
                <div style={{ fontSize: 9, color: V2.textGhost }}>Quizzes, homework, participation</div>
              </div>

              <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.06)' }} />

              {/* Summative gauge */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg width={68} height={68} viewBox="0 0 68 68">
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                    <circle cx={34} cy={34} r={gaugeR} fill="none" stroke={V2.info} strokeWidth={8}
                      strokeDasharray={gaugeC} strokeDashoffset={summOffset}
                      strokeLinecap="round" transform="rotate(-90 34 34)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: V2.info }}>{summScore.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: V2.textSecondary, marginTop: 4 }}>Summative</div>
                <div style={{ fontSize: 9, color: V2.textGhost }}>Tests, exams, projects</div>
              </div>

              <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.06)' }} />

              {/* Insight */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: V2.textHint, lineHeight: 1.5 }}>
                  {formScore > summScore ? (
                    <><em style={{ fontStyle: 'normal', color: V2.success }}>Formative {scoreDiff}% higher</em> than summative &mdash; well balanced.</>
                  ) : summScore > formScore ? (
                    <><em style={{ fontStyle: 'normal', color: V2.info }}>Summative {scoreDiff}% higher</em> than formative.</>
                  ) : (
                    <>Formative and summative scores are equal &mdash; well balanced.</>
                  )}
                </div>
                {data.assessmentBreakdown?.unclassified && data.assessmentBreakdown.unclassified.count > 0 && (
                  <div style={{ fontSize: 9, color: V2.textGhost, marginTop: 8 }}>
                    +{data.assessmentBreakdown.unclassified.count} unclassified (avg {data.assessmentBreakdown.unclassified.avgScore.toFixed(1)}%)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- ROW 2: Grade Distribution (CLS-008) ---- */}
      <div style={{ marginBottom: 12 }}>
        <div style={cardStyle}>
          <CardHeader
            iconBg="rgba(239,159,39,0.10)"
            title="Grade Distribution"
            subtitle="Number of students in each grade range based on overall course averages"
            icon={<BarChartIcon color={V2.warning} />}
          />
          <div style={cardBodyStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, padding: '16px 0 0' }}>
              {distBars.map((bar) => {
                const barColor = DIST_COLORS[bar.letter] || V2.textGhost
                const labelColor = bar.letter === 'D' ? V2.textGhost : barColor
                return (
                  <div key={bar.letter} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: labelColor, marginBottom: 4 }}>{bar.count}</span>
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: barColor, height: `${bar.heightPct}%`, minHeight: 2 }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `1px solid ${V2.borderSeparator}`, marginTop: 12 }}>
              {distBars.map((bar) => (
                <div key={bar.letter} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: V2.textGhost }}>
                  {DIST_LABELS[bar.letter]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- ROW 3: Category Performance + Course Performance (CLS-009, CLS-010) ---- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Category Performance */}
        {data.categoryPerformance && data.categoryPerformance.length > 0 && (
          <div style={cardStyle}>
            <CardHeader
              iconBg="rgba(29,158,117,0.10)"
              title="Category Performance"
              subtitle="Average scores by grading policy category"
              icon={<CircleArrowIcon color={V2.success} />}
            />
            <div style={cardBodyStyle}>
              {/* Column headers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${V2.borderSeparator}` }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, width: 110 }}>Category</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, width: 36, textAlign: 'center' }}>Wt.</span>
                <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, width: 50, textAlign: 'right' }}>#</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, width: 50, textAlign: 'right' }}>Avg</span>
              </div>
              {data.categoryPerformance.map((cat, idx) => {
                const barColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                const matchedWeight = policyWeights?.find((w) => w.categoryId === cat.categoryId)
                const catName = matchedWeight?.categoryName || cat.categoryName.charAt(0).toUpperCase() + cat.categoryName.slice(1)
                const weight = matchedWeight ? `${matchedWeight.weight}%` : '\u2014'
                return (
                  <div key={cat.categoryId} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${V2.borderRow}`, gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: V2.textPrimary, width: 110, flexShrink: 0 }}>{catName}</span>
                    <span style={{ fontSize: 10, color: V2.textHint, width: 36, flexShrink: 0, textAlign: 'center' }}>{weight}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: barColor, width: `${cat.avgScore}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: V2.textHint, width: 50, textAlign: 'right', flexShrink: 0 }}>{cat.assignmentCount}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, width: 50, textAlign: 'right', flexShrink: 0, color: barColor }}>{cat.avgScore.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Course Performance */}
        {data.coursePerformance.length > 0 && (
          <div style={cardStyle}>
            <CardHeader
              iconBg="rgba(55,138,221,0.10)"
              title="Course Performance"
              subtitle="Aggregated grade metrics per course across sections"
              icon={<BookIcon color={V2.info} />}
            />
            <div style={cardBodyStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Course', 'Sec.', 'Std.', 'Avg Grade \u2193', 'GPA', 'Pass %'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i === 0 ? 'left' : 'right',
                          fontSize: 9,
                          fontWeight: 700,
                          color: V2.textGhost,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          padding: '0 0 8px',
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
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${V2.borderRow}`, fontSize: 12, fontWeight: 500, color: V2.textPrimary }}>{course.courseName}</td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${V2.borderRow}`, textAlign: 'right', color: V2.textHint, fontSize: 11 }}>{course.sectionCount}</td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${V2.borderRow}`, textAlign: 'right', color: V2.textHint, fontSize: 11 }}>{course.studentCount}</td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${V2.borderRow}`, textAlign: 'right', fontSize: 12, fontWeight: 600, color: getGradeColorHex(course.avgGrade) }}>
                        {course.avgGrade.toFixed(1)}%
                      </td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${V2.borderRow}`, textAlign: 'right', fontSize: 11, color: V2.textMuted }}>{course.avgGpa.toFixed(2)}</td>
                      <td style={{ padding: '10px 0', borderBottom: `1px solid ${V2.borderRow}`, textAlign: 'right', fontSize: 12, fontWeight: 600, color: getPassColorHex(course.passRate) }}>
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
      <div style={{ marginBottom: 12 }}>
        <div style={cardStyle}>
          <CardHeader
            iconBg="rgba(226,75,74,0.10)"
            title="At-Risk Students"
            subtitle="Students scoring below 60% in any course"
            right={
              data.atRiskStudents.length > 0 ? (
                <span style={{ fontSize: 10, color: V2.textHint }}>{data.atRiskStudents.length} students</span>
              ) : undefined
            }
            icon={<WarningIcon color={V2.danger} />}
          />
          <div style={cardBodyStyle}>
            {data.atRiskStudents.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <CheckCircle style={{ width: 40, height: 40, margin: '0 auto 12px', color: V2.success }} />
                <p style={{ fontSize: 12, color: V2.textMuted }}>No students below the grade threshold</p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${V2.borderSeparator}` }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Student</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>Course</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, width: 80, textAlign: 'right' }}>Grade</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: V2.textGhost, textTransform: 'uppercase', letterSpacing: 0.5, width: 50, textAlign: 'right' }}>Letter</span>
                </div>
                {data.atRiskStudents.map((student, i) => {
                  const gradeColor = student.numericGrade < 60 ? V2.danger : V2.warning
                  const letterBg = student.numericGrade < 60 ? 'rgba(226,75,74,0.10)' : 'rgba(239,159,39,0.10)'
                  const letterColor = student.numericGrade < 60 ? V2.danger : V2.warning
                  return (
                    <div
                      key={`${student.studentId}-${student.courseId}-${i}`}
                      style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${V2.borderRow}`, gap: 12 }}
                    >
                      {/* Avatar chip */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: getStudentGradient(student.studentName),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(student.studentName)}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: V2.textPrimary }}>{student.studentName}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, fontSize: 10, color: V2.textHint }}>{student.courseName}</div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor, width: 80, textAlign: 'right' }}>
                        {student.numericGrade.toFixed(1)}%
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          background: letterBg,
                          color: letterColor,
                          padding: '1px 6px',
                          borderRadius: 4,
                          width: 50,
                          textAlign: 'center',
                        }}
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
